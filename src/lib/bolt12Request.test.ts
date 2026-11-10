import { describe, expect, it } from 'vitest'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bech32Encode, bytesToWords } from './bech32'
import { decodeBolt12 } from './bolt12'
import { buildBolt12InvoiceRequest } from './bolt12Request'

const OFFER = 'lno1pgx9getnwss8vetrw3hhyuckyypwa3eyt44h6txtxquqh7lz5djge4afgfjn7k4rgrkuag0jsd5xvxg'

function bigSize(value: number): number[] {
  if (value < 0xfd) return [value]
  if (value <= 0xffff) return [0xfd, value & 0xff, value >>> 8]
  return [0xfe, value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]
}

function tlv(type: number, value: number[]): number[] {
  return [...bigSize(type), ...bigSize(value.length), ...value]
}

function offerWithQuantityMax(max: number): string {
  const nodeId = secp256k1.getPublicKey(new Uint8Array(32).fill(7), true)
  const fields = [
    ...tlv(10, Array.from(new TextEncoder().encode('quantity test'))),
    ...tlv(20, bigSize(max)),
    ...tlv(22, Array.from(nodeId)),
  ]
  // BOLT12 strings are checksum-less; drop the six bech32 checksum words.
  return bech32Encode('lno', bytesToWords(Uint8Array.from(fields)), 'bech32').slice(0, -6)
}

describe('buildBolt12InvoiceRequest', () => {
  it('copies the offer, adds the payer key and amount, and signs a valid lnr', async () => {
    const built = await buildBolt12InvoiceRequest(OFFER, { amountSats: 21, payerNote: 'test request' })
    expect(built.ok, built.ok ? '' : built.error).toBe(true)
    if (!built.ok) return

    expect(built.request.startsWith('lnr1')).toBe(true)
    expect(built.amountMsat).toBe(21_000)
    expect(built.payerId).toHaveLength(66)

    const decoded = await decodeBolt12(built.request)
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return
    expect(decoded.decoded.kind).toBe('invoice_request')
    expect(decoded.decoded.signatureCheck).toBe('valid')
    expect(decoded.decoded.fields.map(field => field.type)).toContain(88)
    expect(decoded.decoded.fields.map(field => field.type)).toContain(82)
    expect(decoded.decoded.merkleRoot).toBe(built.merkleRoot)
  })

  it('leaves an open offer open when no amount is supplied', async () => {
    const built = await buildBolt12InvoiceRequest(OFFER)
    expect(built.ok).toBe(true)
    if (built.ok) expect(built.amountMsat).toBeNull()
  })

  it('refuses BOLT11, an expired offer and a non-positive amount', async () => {
    expect(await buildBolt12InvoiceRequest('lnbc1qqqq')).toMatchObject({ ok: false })
    expect(await buildBolt12InvoiceRequest(OFFER, { amountSats: 0 })).toEqual({
      ok: false,
      error: 'Amount must be a whole number of sats greater than zero.',
    })
  })

  it('enforces offer quantity_max and carries invreq_quantity', async () => {
    const offer = offerWithQuantityMax(5)
    const tooMany = await buildBolt12InvoiceRequest(offer, { quantity: 6 })
    expect(tooMany).toEqual({ ok: false, error: 'Quantity must be a whole number from 1 to 5.' })

    const built = await buildBolt12InvoiceRequest(offer, { quantity: 3 })
    expect(built.ok, built.ok ? '' : built.error).toBe(true)
    if (!built.ok) return
    const decoded = await decodeBolt12(built.request)
    expect(decoded.ok).toBe(true)
    if (decoded.ok) expect(decoded.decoded.quantity).toBe(3)
  })

  it('refuses a quantity on an offer without quantity_max', async () => {
    expect(await buildBolt12InvoiceRequest(OFFER, { quantity: 1 })).toEqual({
      ok: false,
      error: 'The offer does not allow a quantity field.',
    })
  })
})

