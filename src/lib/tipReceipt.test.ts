import { describe, expect, it } from 'vitest'
import { buildTipReceipt, canIssueReceipt, publishTipReceipt, receiptEvidenceLine } from './tipReceipt'

const HASH = 'd'.repeat(64)
const PREIMAGE = 'e'.repeat(64)

describe('buildTipReceipt', () => {
  it('records the invoice, amount and settlement the wallet reported', () => {
    const built = buildTipReceipt({
      program: 'Panama',
      countryCode: 'PA',
      factKey: 'gov_fees',
      sats: 5_000,
      paymentHash: HASH.toUpperCase(),
      preimage: PREIMAGE,
      invoice: 'lnbc50u1pjdemo',
      settledAt: 1_760_000_000,
    })
    expect(built.ok).toBe(true)
    if (!built.ok) return
    expect(built.event.kind).toBe(30078)
    expect(built.event.created_at).toBe(1_760_000_000)
    expect(built.event.tags).toContainEqual(['amount', '5000'])
    expect(built.event.tags).toContainEqual(['payment_hash', HASH])
    expect(built.event.tags).toContainEqual(['preimage', PREIMAGE])
    expect(built.event.tags).toContainEqual(['settled_at', '1760000000'])
    expect(built.event.tags).toContainEqual(['field', 'gov_fees'])
    expect(built.event.tags).toContainEqual(['country', 'PA'])
    const content = JSON.parse(built.event.content)
    expect(content).toMatchObject({ kind: 'gap-tip-receipt', sats: 5_000, settlement_source: 'nip47-lookup-invoice' })
  })

  it('does not assert a settlement time or preimage it was not given', () => {
    const built = buildTipReceipt({
      program: 'Panama',
      factKey: 'gov_fees',
      sats: 5_000,
      paymentHash: HASH,
      createdAt: 1_760_000_000,
    })
    expect(built.ok).toBe(true)
    if (!built.ok) return
    expect(built.event.tags.some(tag => tag[0] === 'settled_at')).toBe(false)
    expect(built.event.tags.some(tag => tag[0] === 'preimage')).toBe(false)
    expect(JSON.parse(built.event.content).settled_at).toBeNull()
  })

  it('refuses a tip with no amount or a malformed hash', () => {
    const base = { program: 'Panama', factKey: 'gov_fees', sats: 5_000, paymentHash: HASH }
    expect(buildTipReceipt({ ...base, sats: 0 })).toEqual({ ok: false, error: 'Amount must be whole sats' })
    expect(buildTipReceipt({ ...base, sats: 1.5 })).toEqual({ ok: false, error: 'Amount must be whole sats' })
    expect(buildTipReceipt({ ...base, paymentHash: 'nope' })).toEqual({
      ok: false,
      error: 'Payment hash must be 64 hex characters',
    })
    expect(buildTipReceipt({ ...base, preimage: 'abc' })).toEqual({
      ok: false,
      error: 'Preimage must be 64 hex characters',
    })
    expect(buildTipReceipt({ ...base, factKey: '  ' })).toEqual({ ok: false, error: 'Fact is required' })
  })

  it('derives a stable d tag from the payment hash', () => {
    const one = buildTipReceipt({ program: 'Panama', factKey: 'gov_fees', sats: 5_000, paymentHash: HASH })
    const two = buildTipReceipt({ program: 'Panama', factKey: 'gov_fees', sats: 5_000, paymentHash: HASH })
    expect(one.ok && two.ok && one.event.tags[0][1]).toBe(`motopass-tip-panama-gov-fees-${HASH.slice(0, 12)}`)
  })
})

describe('publishTipReceipt without a signer', () => {
  it('hands back the exact event instead of claiming a publish', async () => {
    const built = buildTipReceipt({ program: 'Panama', factKey: 'gov_fees', sats: 5_000, paymentHash: HASH })
    expect(built.ok).toBe(true)
    if (!built.ok) return
    const result = await publishTipReceipt(built.event)
    expect(result.status).toBe('unsigned')
    expect(JSON.parse(result.json).kind).toBe(30078)
  })
})

describe('settlement gate and wording', () => {
  it('only a paid state can issue a receipt', () => {
    expect(canIssueReceipt('paid')).toBe(true)
    for (const state of ['pending', 'expired', 'failed', 'unknown', '']) {
      expect(canIssueReceipt(state)).toBe(false)
    }
  })

  it('describes the proof without overclaiming', () => {
    expect(receiptEvidenceLine(HASH, PREIMAGE)).toContain('sha256(preimage)')
    expect(receiptEvidenceLine(HASH, null)).toContain('no preimage reported')
  })
})
