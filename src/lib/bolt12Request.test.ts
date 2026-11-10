import { describe, expect, it } from 'vitest'
import { decodeBolt12 } from './bolt12'
import { buildBolt12InvoiceRequest } from './bolt12Request'

const OFFER = 'lno1pgx9getnwss8vetrw3hhyuckyypwa3eyt44h6txtxquqh7lz5djge4afgfjn7k4rgrkuag0jsd5xvxg'

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
})

