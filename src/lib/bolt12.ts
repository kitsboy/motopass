import { schnorr } from '@noble/curves/secp256k1.js'
import { bech32Decode, bytesToHex, wordsToBytes } from './bech32'

/**
 * BOLT12 reader and signature verifier.
 *
 * A BOLT12 offer (`lno1…`) is **not signed** — the spec deliberately leaves the
 * offer unsigned because every non-signature field is copied into the invoice
 * request, and the invoice is what gets signed. So an offer can be decoded and
 * checked for structure, but there is no offer signature to verify; this module
 * says exactly that instead of inventing one.
 *
 * Invoice requests (`lnr1…`) and invoices (`lni1…`) do carry a BIP-340
 * signature over a Merkle root of their TLV fields. Those are verified here,
 * against the payer/node id in the same message. Nothing is fetched or published.
 */

export type Bolt12Kind = 'offer' | 'invoice_request' | 'invoice'

export interface Bolt12Field {
  type: number
  length: number
  hex: string
  name: string | null
  text: string | null
  number: number | null
}

export type Bolt12SignatureCheck = 'valid' | 'invalid' | 'unsigned' | 'unavailable'

export interface Bolt12Decoded {
  kind: Bolt12Kind
  hrp: string
  fields: Bolt12Field[]
  description: string | null
  amount: number | null
  amountUnit: 'msat' | 'currency-minor' | null
  currency: string | null
  issuer: string | null
  nodeId: string | null
  payerId: string | null
  paymentHash: string | null
  createdAt: number | null
  absoluteExpiry: number | null
  signature: string | null
  signingKey: string | null
  merkleRoot: string | null
  signatureTag: string | null
  signatureCheck: Bolt12SignatureCheck
  signatureNote: string
  warnings: string[]
}

export type Bolt12Result =
  | { ok: true; decoded: Bolt12Decoded }
  | { ok: false; error: string }

export interface Bolt12Offer {
  /** The lowercased offer, ready for a `lightning:` URI. */
  offer: string
  hrp: 'lno'
  /** Number of 5-bit data words after the separator. */
  wordCount: number
}

export type Bolt12Parse =
  | { ok: true; offer: Bolt12Offer }
  | { ok: false; error: string }

const FIELD_NAMES: Record<number, string> = {
  0: 'invreq_metadata',
  2: 'offer_chains',
  4: 'offer_metadata',
  6: 'offer_currency',
  8: 'offer_amount',
  10: 'offer_description',
  12: 'offer_features',
  14: 'offer_absolute_expiry',
  16: 'offer_paths',
  18: 'offer_issuer',
  20: 'offer_quantity_max',
  22: 'offer_issuer_id',
  80: 'invreq_chain',
  82: 'invreq_amount',
  84: 'invreq_features',
  86: 'invreq_quantity',
  88: 'invreq_payer_id',
  89: 'invreq_payer_note',
  90: 'invreq_paths',
  91: 'invreq_bip_353_name',
  160: 'invoice_paths',
  162: 'invoice_blindedpay',
  164: 'invoice_created_at',
  166: 'invoice_relative_expiry',
  168: 'invoice_payment_hash',
  170: 'invoice_amount',
  172: 'invoice_fallbacks',
  174: 'invoice_features',
  176: 'invoice_node_id',
  240: 'signature',
}

const KIND_BY_HRP: Record<string, Bolt12Kind> = {
  lno: 'offer',
  lnr: 'invoice_request',
  lni: 'invoice',
}

const MESSAGE_BY_KIND: Record<Bolt12Kind, string> = {
  offer: 'offer',
  invoice_request: 'invoice_request',
  invoice: 'invoice',
}

interface RawField {
  type: number
  typeBytes: Uint8Array
  encoded: Uint8Array
  value: Uint8Array
}

interface Structure {
  kind: Bolt12Kind
  hrp: string
  fields: RawField[]
}

function readBigSize(bytes: Uint8Array, offset: number): { value: number; next: number } | null {
  if (offset >= bytes.length) return null
  const first = bytes[offset]
  if (first < 0xfd) return { value: first, next: offset + 1 }

  const length = first === 0xfd ? 2 : first === 0xfe ? 4 : 8
  const start = offset + 1
  if (start + length > bytes.length) return null
  let value = 0n
  for (let i = 0; i < length; i += 1) value = (value << 8n) | BigInt(bytes[start + i])
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) return null
  return { value: Number(value), next: start + length }
}

function normalizeBolt12(raw: string): string {
  return raw
    .trim()
    .replace(/\+[\s]*/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function decodeStructure(raw: string): { ok: true; structure: Structure } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'Paste a BOLT12 string first' }
  const withoutSplits = trimmed.replace(/\+[\s]*/g, '').replace(/\s+/g, '')
  if (withoutSplits !== withoutSplits.toLowerCase() && withoutSplits !== withoutSplits.toUpperCase()) {
    return { ok: false, error: 'Mixed case' }
  }
  const normalized = normalizeBolt12(raw)
  if (normalized.length > 16_384) return { ok: false, error: 'String is too long to be a BOLT12 message' }

  const decoded = bech32Decode(normalized, { checksum: false })
  if (!decoded.ok) return { ok: false, error: decoded.error }
  const kind = KIND_BY_HRP[decoded.hrp]
  if (!kind) return { ok: false, error: 'Unknown BOLT12 prefix — expected lno, lnr or lni' }

  const bytes = wordsToBytes(decoded.words)
  if (!bytes) return { ok: false, error: 'BOLT12 data does not pad to whole bytes' }

  const fields: RawField[] = []
  let offset = 0
  let previousType = -1
  while (offset < bytes.length) {
    const start = offset
    const type = readBigSize(bytes, offset)
    if (!type) return { ok: false, error: 'TLV type is truncated' }
    const length = readBigSize(bytes, type.next)
    if (!length) return { ok: false, error: `TLV ${type.value} has no readable length` }
    const end = length.next + length.value
    if (end > bytes.length) return { ok: false, error: `TLV ${type.value} is longer than its data` }
    if (type.value <= previousType) {
      return { ok: false, error: 'TLV fields are not in ascending order' }
    }
    fields.push({
      type: type.value,
      typeBytes: bytes.slice(start, type.next),
      encoded: bytes.slice(start, end),
      value: bytes.slice(length.next, end),
    })
    previousType = type.value
    offset = end
  }
  if (fields.length === 0) return { ok: false, error: 'BOLT12 message carries no TLV fields' }

  return { ok: true, structure: { kind, hrp: decoded.hrp, fields } }
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

function fieldNumber(bytes: Uint8Array): number | null {
  if (bytes.length === 0 || bytes.length > 8) return null
  let value = 0
  for (const byte of bytes) value = value * 256 + byte
  return Number.isSafeInteger(value) ? value : null
}

function safeHex(bytes: Uint8Array): string {
  return bytesToHex(bytes)
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array | null> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return null
  const input = new Uint8Array(bytes.length)
  input.set(bytes)
  try {
    return new Uint8Array(await subtle.digest('SHA-256', input.buffer))
  } catch {
    return null
  }
}

/** BIP-340 tagged hash: SHA256(SHA256(tag) || SHA256(tag) || msg). */
async function taggedHashBytes(tag: Uint8Array, message: Uint8Array): Promise<Uint8Array | null> {
  const tagHash = await sha256(tag)
  if (!tagHash) return null
  return sha256(concat(tagHash, tagHash, message))
}

function taggedHash(tag: string, message: Uint8Array): Promise<Uint8Array | null> {
  return taggedHashBytes(new TextEncoder().encode(tag), message)
}

function lesserFirst(a: Uint8Array, b: Uint8Array): Uint8Array {
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? concat(a, b) : concat(b, a)
  }
  return a.length <= b.length ? concat(a, b) : concat(b, a)
}

/**
 * Merkle root over the signed TLVs, as specified in BOLT12:
 * each TLV is a leaf paired with a nonce; inner nodes are
 * H("LnBranch", lesser || greater), odd leaves carried up.
 */
async function merkleRoot(fields: RawField[]): Promise<Uint8Array | null> {
  if (fields.length === 0) return null
  const first = fields[0].encoded
  let level: Uint8Array[] = []

  for (const field of fields) {
    const leaf = await taggedHash('LnLeaf', field.encoded)
    // BOLT12 puts the first TLV into the *tag*: H("LnNonce"||first-tlv, type).
    const nonce = await taggedHashBytes(
      concat(new TextEncoder().encode('LnNonce'), first),
      field.typeBytes,
    )
    if (!leaf || !nonce) return null
    const paired = await taggedHash('LnBranch', lesserFirst(leaf, nonce))
    if (!paired) return null
    level.push(paired)
  }

  while (level.length > 1) {
    const next: Uint8Array[] = []
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 >= level.length) {
        next.push(level[i])
      } else {
        const branch = await taggedHash('LnBranch', lesserFirst(level[i], level[i + 1]))
        if (!branch) return null
        next.push(branch)
      }
    }
    level = next
  }
  return level[0]
}

function describeField(field: RawField): Bolt12Field {
  const name = FIELD_NAMES[field.type] ?? null
  let text: string | null = null
  let number: number | null = null

  if (
    field.type === 6 ||
    field.type === 10 ||
    field.type === 18 ||
    field.type === 89
  ) {
    text = decodeUtf8(field.value)
  }
  if (
    field.type === 8 ||
    field.type === 14 ||
    field.type === 20 ||
    field.type === 82 ||
    field.type === 86 ||
    field.type === 164 ||
    field.type === 166 ||
    field.type === 170
  ) {
    number = fieldNumber(field.value)
  }

  return {
    type: field.type,
    length: field.value.length,
    hex: safeHex(field.value),
    name,
    text,
    number,
  }
}

/** Decode a BOLT12 message and verify its signature when the format has one. */
export async function decodeBolt12(raw: string): Promise<Bolt12Result> {
  const parsed = decodeStructure(raw)
  if (!parsed.ok) return parsed
  const { kind, hrp, fields } = parsed.structure

  const warnings: string[] = []
  const byType = new Map(fields.map(field => [field.type, field.value]))
  const signatureField = fields.find(field => field.type === 240)
  const signable = fields.filter(field => field.type < 240 || field.type > 1000)

  for (const field of fields) {
    if (!FIELD_NAMES[field.type]) {
      if (field.type % 2 === 0) warnings.push(`Unknown even TLV type ${field.type} — this reader cannot interpret it.`)
    }
    if (kind === 'offer' && ((field.type >= 80 && field.type <= 239) || field.type >= 1_000_000_000)) {
      warnings.push(`TLV ${field.type} is outside the ranges an offer may use.`)
    }
  }

  const currency = byType.has(6) ? decodeUtf8(byType.get(6)!) : null
  const amountField = kind === 'invoice' ? 170 : 8
  const amount = byType.has(amountField) ? fieldNumber(byType.get(amountField)!) : null
  const rawDescription = byType.get(10)
  const description = rawDescription ? decodeUtf8(rawDescription) : null
  const rawIssuer = byType.get(18)
  const issuer = rawIssuer ? decodeUtf8(rawIssuer) : null
  const nodeField = kind === 'invoice' ? 176 : 22
  const nodeId = byType.has(nodeField) ? safeHex(byType.get(nodeField)!) : null
  const payerId = byType.has(88) ? safeHex(byType.get(88)!) : null
  const paymentHash = byType.has(168) ? safeHex(byType.get(168)!) : null
  const createdAt = byType.has(164) ? fieldNumber(byType.get(164)!) : null
  const absoluteExpiry = byType.has(14) ? fieldNumber(byType.get(14)!) : null

  if (description == null && rawDescription) warnings.push('Description is not valid UTF-8.')
  if (issuer == null && rawIssuer) warnings.push('Issuer is not valid UTF-8.')

  let signatureCheck: Bolt12SignatureCheck = 'unavailable'
  let signatureNote = ''
  let signingKey: string | null = null
  let root: string | null = null
  let signatureTag: string | null = null
  let signature: string | null = null

  if (kind === 'offer') {
    signatureCheck = 'unsigned'
    signatureNote =
      'BOLT12 offers are unsigned by design. There is no offer signature to verify — the invoice request and invoice carry the signatures.'
    if (signatureField) {
      signatureCheck = 'invalid'
      signatureNote = 'An offer must not carry a signature field; this string is not a well-formed offer.'
    }
  } else {
    const keyType = kind === 'invoice_request' ? 88 : 176
    const key = byType.get(keyType)
    signingKey = key ? safeHex(key) : null
    signatureTag = `lightning${MESSAGE_BY_KIND[kind]}signature`

    if (!signatureField) {
      signatureNote = 'This message carries no signature field, so nothing can be verified.'
    } else if (signatureField.value.length !== 64) {
      signatureCheck = 'invalid'
      signatureNote = 'Signature field is not 64 bytes.'
      signature = safeHex(signatureField.value)
    } else if (!key) {
      signatureNote = `This message has no ${keyType === 88 ? 'invreq_payer_id' : 'invoice_node_id'} to verify against.`
      signature = safeHex(signatureField.value)
    } else {
      signature = safeHex(signatureField.value)
      const rootBytes = await merkleRoot(signable)
      if (!rootBytes) {
        signatureNote = 'The Merkle root could not be computed in this browser.'
      } else {
        root = safeHex(rootBytes)
        const tagged = await taggedHash(signatureTag, rootBytes)
        if (!tagged) {
          signatureNote = 'The signature hash could not be computed in this browser.'
        } else {
          try {
            const keyBytes = key.length === 33 ? key.slice(1) : key
            const valid = schnorr.verify(signatureField.value, tagged, keyBytes)
            signatureCheck = valid ? 'valid' : 'invalid'
            signatureNote = valid
              ? 'BIP-340 signature verifies against the Merkle root and the key in this message.'
              : 'Signature does not verify against this message and key.'
          } catch {
            signatureCheck = 'invalid'
            signatureNote = 'Signature or key is not a valid BIP-340 value.'
          }
        }
      }
    }
  }

  return {
    ok: true,
    decoded: {
      kind,
      hrp,
      fields: fields.map(describeField),
      description,
      amount,
      amountUnit: amount == null ? null : currency ? 'currency-minor' : 'msat',
      currency,
      issuer,
      nodeId,
      payerId,
      paymentHash,
      createdAt,
      absoluteExpiry,
      signature,
      signingKey,
      merkleRoot: root,
      signatureTag,
      signatureCheck,
      signatureNote,
      warnings: Array.from(new Set(warnings)),
    },
  }
}

/**
 * Structural check for a configured offer. BOLT12 has no bech32 checksum, so
 * this validates the TLV stream instead of a checksum. It does not claim the
 * offer is live, payable, or signed — offers cannot be signed.
 */
export function parseBolt12Offer(raw: string): Bolt12Parse {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'No offer configured' }
  if (!normalizeBolt12(value).startsWith('lno1')) {
    return { ok: false, error: 'Not a BOLT12 offer — expected lno1…' }
  }
  if (value.length > 4096) return { ok: false, error: 'Offer is too long to be a BOLT12 string' }
  const parsed = decodeStructure(value)
  if (!parsed.ok) return parsed
  if (parsed.structure.kind !== 'offer') return { ok: false, error: 'Prefix does not describe an offer' }
  const words = bech32Decode(normalizeBolt12(value), { checksum: false })
  if (!words.ok) return words
  return {
    ok: true,
    offer: { offer: normalizeBolt12(value), hrp: 'lno', wordCount: words.words.length },
  }
}

/** Wallet deep link for a structurally valid offer. */
export function offerDeepLink(raw: string): string | null {
  const parsed = parseBolt12Offer(raw)
  return parsed.ok ? `lightning:${parsed.offer.offer}` : null
}

/** Short, copy-safe label: prefix and tail, never a truncated *valid* string. */
export function shortOffer(raw: string): string {
  const value = raw.trim()
  if (value.length <= 20) return value
  return `${value.slice(0, 10)}…${value.slice(-6)}`
}
