import { describe, expect, it } from 'vitest'
import { anchorReceiptDigest, receiptAnchorStatus } from './receiptAnchor'

describe('receipt anchoring', () => {
  it('never invents a confirmation from a pending response', () => {
    expect(receiptAnchorStatus('pending', null)).toBe('pending')
    expect(receiptAnchorStatus('anchored', null)).toBe('confirmed')
    expect(receiptAnchorStatus('complete', 900000)).toBe('confirmed')
    expect(receiptAnchorStatus('failed', null)).toBe('error')
  })

  it('rejects a malformed digest before any network call', async () => {
    const result = await anchorReceiptDigest('not-a-digest')
    expect(result.status).toBe('error')
    expect(result.note).toMatch(/64 lowercase hex/)
    expect(result.verifyUrl).toBe('')
  })
})
