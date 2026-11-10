import { describe, expect, it } from 'vitest'
import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js'
import { BECH32_CHARSET, bytesToWords } from './bech32'
import { bolt12TaggedHash, computeBolt12MerkleRoot, decodeBolt12 } from './bolt12'
import { buildBolt12InvoiceRequest } from './bolt12Request'
import { verifyBolt12InvoiceResponse } from './bolt12Response'

const OFFER = 'lno1pgx9getnwss8vetrw3hhyuckyypwa3eyt44h6txtxquqh7lz5djge4afgfjn7k4rgrkuag0jsd5xvxg'
const NODE_SECRET = new Uint8Array(32).fill(21)
const NODE_KEY = secp256k1.getPublicKey(NODE_SECRET, true)

function bigSize(value: number): Uint8Array {
  if (value < 0xfd) return Uint8Array.from([value])
  if (value <= 0xffff) return Uint8Array.from([0xfd, value >> 8, value & 0xff])
  return Uint8Array.from([0xfe, (value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff])
}

function tlv(type: number, value: Uint8Array): Uint8Array {
  return Uint8Array.from([...bigSize(type), ...bigSize(value.length), ...value])
}

function numberBytes(value: number): Uint8Array {
  const out: number[] = []
  let remaining = value
  do {
    out.unshift(remaining & 0xff)
    remaining = Math.floor(remaining / 256)
  } while (remaining > 0)
  return Uint8Array.from(out)
}

function hexBytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g)?.map(byte => Number.parseInt(byte, 16)) ?? [])
}

function encodeInvoice(hrp: string, bytes: Uint8Array): string {
  return `${hrp}1${bytesToWords(bytes).map(word => BECH32_CHARSET[word]).join('')}`
}

async function invoiceFor(requestRaw: string, amountMsat = 21_000): Promise<string> {
  const request = await decodeBolt12(requestRaw)
  if (!request.ok) throw new Error(request.error)
  const offer = await decodeBolt12(OFFER)
  if (!offer.ok) throw new Error(offer.error)

  const fields = new Map<number, Uint8Array>()
  for (const field of offer.decoded.fields) fields.set(field.type, hexBytes(field.hex))
  fields.set(164, numberBytes(1_700_000_000))
  fields.set(168, new Uint8Array(32).fill(9))
  fields.set(170, numberBytes(amountMsat))
  fields.set(176, NODE_KEY)
  const noSig = [...fields.entries()]
    .sort(([a], [b]) => a - b)
    .map(([type, value]) => ({ type, value, encoded: tlv(type, value) }))
  const root = await computeBolt12MerkleRoot(
    noSig.map(field => ({ encoded: field.encoded, typeBytes: bigSize(field.type) })),
  )
  if (!root) throw new Error('root')
  const tagged = await bolt12TaggedHash('lightninginvoicesignature', root)
  if (!tagged) throw new Error('tag')
  const signature = schnorr.sign(tagged, NODE_SECRET)
  const signatureTlv = tlv(240, signature)
  const all = [...noSig.map(field => field.encoded), signatureTlv]
  return encodeInvoice('lni', Uint8Array.from(all.flatMap(field => [...field])))
}

describe('verifyBolt12InvoiceResponse', () => {
  it('accepts a signed invoice that copies the offer and matches the request amount', async () => {
    const built = await buildBolt12InvoiceRequest(OFFER, { amountSats: 21 })
    expect(built.ok).toBe(true)
    if (!built.ok) return
    const invoice = await invoiceFor(built.request)
    const verified = await verifyBolt12InvoiceResponse(OFFER, built.request, invoice)
    expect(verified.ok, verified.ok ? '' : verified.error).toBe(true)
    if (!verified.ok) return
    expect(verified.result.checks.invoiceSignature).toBe(true)
    expect(verified.result.checks.requestSignature).toBe(true)
    expect(verified.result.checks.offerFieldsInRequest).toBe(true)
    expect(verified.result.checks.offerFieldsInInvoice).toBe(true)
    expect(verified.result.checks.amountMatches).toBe(true)
    expect(verified.result.checks.paymentHashPresent).toBe(true)
    expect(verified.result.mismatches).toEqual([])
  })

  it('flags an invoice whose amount differs from the request', async () => {
    const built = await buildBolt12InvoiceRequest(OFFER, { amountSats: 21 })
    expect(built.ok).toBe(true)
    if (!built.ok) return
    const invoice = await invoiceFor(built.request, 22_000)
    const verified = await verifyBolt12InvoiceResponse(OFFER, built.request, invoice)
    expect(verified.ok).toBe(true)
    if (verified.ok) {
      expect(verified.result.checks.amountMatches).toBe(false)
      expect(verified.result.mismatches.join(' ')).toContain('does not match')
    }
  })

  it('refuses the wrong message kinds', async () => {
    const built = await buildBolt12InvoiceRequest(OFFER)
    expect(built.ok).toBe(true)
    if (!built.ok) return
    expect(await verifyBolt12InvoiceResponse(built.request, built.request, built.request)).toMatchObject({ ok: false })
  })
})
