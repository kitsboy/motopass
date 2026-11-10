import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js'
import { BECH32_CHARSET, bytesToHex, bytesToWords } from './bech32'
import {
  bolt12TaggedHash,
  computeBolt12MerkleRoot,
  decodeBolt12,
  type Bolt12Decoded,
} from './bolt12'

/**
 * Build a BOLT12 invoice request (`lnr…`) from an offer.
 *
 * This is a real, locally signed request: a fresh payer key is generated in
 * this tab, every non-signature offer TLV is copied, the amount and an optional
 * payer note are added, and the message is signed with BIP-340. The private key
 * is deliberately not returned or stored. The request is a message for the
 * issuer — it does not send, pay, or prove anything by itself.
 */

export interface Bolt12RequestOptions {
  amountSats?: number | null
  payerNote?: string
  /** Required when offer_quantity_max is present and greater than zero. */
  quantity?: number | null
}

export type Bolt12RequestResult =
  | {
      ok: true
      request: string
      payerId: string
      merkleRoot: string
      amountMsat: number | null
      copiedFields: number[]
    }
  | { ok: false; error: string }

function encodeBigSize(value: number): Uint8Array {
  if (value < 0xfd) return Uint8Array.from([value])
  if (value <= 0xffff) return Uint8Array.from([0xfd, value >> 8, value & 0xff])
  if (value <= 0xffff_ffff) {
    return Uint8Array.from([0xfe, (value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff])
  }
  throw new Error('TLV type is too large to encode')
}

function encodeUint(value: number): Uint8Array {
  const out: number[] = []
  let remaining = value
  do {
    out.unshift(remaining & 0xff)
    remaining = Math.floor(remaining / 256)
  } while (remaining > 0)
  return Uint8Array.from(out)
}

function encodeTlv(type: number, value: Uint8Array): Uint8Array {
  const typeBytes = encodeBigSize(type)
  const lengthBytes = encodeBigSize(value.length)
  const out = new Uint8Array(typeBytes.length + lengthBytes.length + value.length)
  out.set(typeBytes)
  out.set(lengthBytes, typeBytes.length)
  out.set(value, typeBytes.length + lengthBytes.length)
  return out
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function encodeBolt12(hrp: string, bytes: Uint8Array): string {
  return `${hrp}1${bytesToWords(bytes).map(word => BECH32_CHARSET[word]).join('')}`
}

function randomMetadata(): Uint8Array | null {
  const random = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto)
  if (!random) return null
  return random(new Uint8Array(16))
}

export async function buildBolt12InvoiceRequest(
  rawOffer: string,
  opts: Bolt12RequestOptions = {},
): Promise<Bolt12RequestResult> {
  const parsed = await decodeBolt12(rawOffer)
  if (!parsed.ok) return parsed
  const offer: Bolt12Decoded = parsed.decoded
  if (offer.kind !== 'offer') return { ok: false, error: 'Paste an offer (lno1…), not an invoice request or invoice' }

  if (offer.absoluteExpiry != null && offer.absoluteExpiry <= Math.floor(Date.now() / 1000)) {
    return { ok: false, error: 'This offer has expired; the issuer should not accept a new request.' }
  }
  if (!offer.nodeId && !offer.fields.some(field => field.type === 16 || field.type === 22)) {
    return { ok: false, error: 'The offer has neither an issuer id nor a path, so there is nowhere to send a request.' }
  }

  const metadata = randomMetadata()
  if (!metadata) return { ok: false, error: 'This browser cannot generate the random request metadata.' }

  const fields = new Map<number, Uint8Array>()
  // invreq_metadata is type 0, so it must come first in the signed stream.
  fields.set(0, metadata)
  for (const field of offer.fields) {
    if (field.type === 240) continue
    fields.set(field.type, hexToBytes(field.hex))
  }

  let amountMsat: number | null = null
  if (opts.amountSats != null) {
    if (!Number.isSafeInteger(opts.amountSats) || opts.amountSats <= 0) {
      return { ok: false, error: 'Amount must be a whole number of sats greater than zero.' }
    }
    amountMsat = opts.amountSats * 1000
    if (!Number.isSafeInteger(amountMsat)) return { ok: false, error: 'Amount is too large to encode.' }
  } else if (offer.amount != null && !offer.currency) {
    amountMsat = offer.amount
  } else if (offer.amount != null && offer.currency) {
    return {
      ok: false,
      error: `This offer is priced in ${offer.currency}; enter an amount in sats so the request can carry millisatoshis.`,
    }
  }

  if (amountMsat != null) {
    // invreq_amount is a tu64, not a BigSize-prefixed integer.
    fields.set(82, encodeUint(amountMsat))
  }

  if (offer.quantityMax != null) {
    const quantity = opts.quantity ?? (offer.quantityMax > 0 ? 1 : null)
    if (offer.quantityMax === 0) {
      if (quantity != null) return { ok: false, error: 'This offer has quantity_max 0 (unlimited), so a request must omit quantity.' }
    } else if (quantity == null || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > offer.quantityMax) {
      return { ok: false, error: `Quantity must be a whole number from 1 to ${offer.quantityMax}.` }
    } else {
      fields.set(86, encodeUint(quantity))
    }
  } else if (opts.quantity != null) {
    return { ok: false, error: 'The offer does not allow a quantity field.' }
  }

  const note = opts.payerNote?.trim()
  if (note) {
    if (note.length > 512) return { ok: false, error: 'Payer note is longer than 512 characters.' }
    fields.set(89, new TextEncoder().encode(note))
  }

  const secret = secp256k1.utils.randomSecretKey()
  const payerKey = secp256k1.getPublicKey(secret, true)
  fields.set(88, payerKey)

  const ordered = [...fields.entries()].sort(([a], [b]) => a - b)
  const encodedFields = ordered.map(([type, value]) => ({ type, value, encoded: encodeTlv(type, value) }))
  const root = await computeBolt12MerkleRoot(
    encodedFields.map(field => ({ encoded: field.encoded, typeBytes: encodeBigSize(field.type) })),
  )
  if (!root) return { ok: false, error: 'The BOLT12 Merkle root could not be computed in this browser.' }

  const tagged = await bolt12TaggedHash('lightninginvoice_requestsignature', root)
  if (!tagged) return { ok: false, error: 'The BOLT12 signature hash could not be computed in this browser.' }

  const signature = schnorr.sign(tagged, secret)
  const signatureTlv = encodeTlv(240, signature)
  const body = new Uint8Array(encodedFields.reduce((sum, field) => sum + field.encoded.length, 0) + signatureTlv.length)
  let offset = 0
  for (const field of encodedFields) {
    body.set(field.encoded, offset)
    offset += field.encoded.length
  }
  body.set(signatureTlv, offset)

  return {
    ok: true,
    request: encodeBolt12('lnr', body),
    payerId: bytesToHex(payerKey),
    merkleRoot: bytesToHex(root),
    amountMsat,
    copiedFields: offer.fields.map(field => field.type),
  }
}
