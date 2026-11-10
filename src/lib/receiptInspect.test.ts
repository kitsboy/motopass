import { describe, it, expect } from 'vitest'
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'
import { buildTipReceipt } from './tipReceipt'
import { inspectTipReceiptJson } from './receiptInspect'

const HASH = 'a'.repeat(64)
const PREIMAGE = 'b'.repeat(64)

function signed() {
  const built = buildTipReceipt({
    program: 'Panama',
    countryCode: 'PA',
    factKey: 'gov_fees',
    sats: 5_000,
    paymentHash: HASH,
    preimage: PREIMAGE,
    invoice: 'lnbc50u1example',
    settledAt: 1_760_000_100,
    createdAt: 1_760_000_100,
  })
  if (!built.ok) throw new Error(built.error)
  return finalizeEvent(
    { kind: 30078, created_at: built.event.created_at, tags: built.event.tags, content: built.event.content },
    generateSecretKey(),
  )
}

describe('inspectTipReceiptJson', () => {
  it('reads a signed receipt and the tags it actually carries', () => {
    const result = inspectTipReceiptJson(JSON.stringify(signed()))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.details).toMatchObject({
      program: 'Panama',
      field: 'gov_fees',
      country: 'PA',
      sats: 5_000,
      paymentHash: HASH,
      preimage: PREIMAGE,
      settledAt: 1_760_000_100,
      invoice: 'lnbc50u1example',
    })
  })

  it('refuses a receipt whose content was rewritten after signing', () => {
    const event = signed()
    const result = inspectTipReceiptJson(JSON.stringify({ ...event, content: '{"sats":999999}' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/did not verify/)
  })

  it('refuses invalid JSON, an empty paste and a badge-shaped object', () => {
    expect(inspectTipReceiptJson('')).toEqual({ ok: false, error: 'Paste a receipt event first' })
    expect(inspectTipReceiptJson('not json{')).toEqual({ ok: false, error: 'That is not valid JSON' })
    expect(inspectTipReceiptJson('{"id":"x"}').ok).toBe(false)
  })
})
