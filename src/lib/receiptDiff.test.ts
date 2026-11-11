import { describe, expect, it } from 'vitest'
import { buildVerificationReceipt } from './verificationReceipt'
import { diffVerificationReceipts, groupDigestFingerprint } from './receiptDiff'

function receipt(title: string, purpose: string, state: 'pass' | 'unknown' = 'pass') {
  return buildVerificationReceipt(
    {
      tool: 'bolt11',
      title,
      steps: [{ label: 'checksum', state }],
      limits: ['Not proof of payment.'],
      fields: { purpose, amount: '1000' },
    },
    new Date('2026-11-10T12:34:56.000Z'),
  )
}

describe('receipt diff', () => {
  it('names the changed canonical fields and keeps unchanged fields out', () => {
    const rows = diffVerificationReceipts(receipt('Invoice A', 'residency fee'), receipt('Invoice B', 'residency fee', 'unknown'))
    expect(rows.map(row => row.path)).toEqual(['steps[0].state', 'title'])
    expect(rows.find(row => row.path === 'title')).toMatchObject({
      before: 'Invoice A',
      after: 'Invoice B',
      state: 'changed',
    })
  })

  it('records added and removed fields', () => {
    const original = receipt('Invoice A', 'residency fee')
    const changed = { ...original, fields: { amount: '1000', extra: true } }
    const rows = diffVerificationReceipts(original, changed)
    expect(rows.find(row => row.path === 'fields.extra')).toMatchObject({ state: 'added', before: '—' })
    expect(rows.find(row => row.path === 'fields.purpose')).toMatchObject({ state: 'removed', after: '—' })
  })

  it('formats a digest as a comparable fingerprint', () => {
    expect(groupDigestFingerprint('a'.repeat(64))).toMatch(/^aaaa aaaa/)
    expect(groupDigestFingerprint('abc')).toBe('abc')
  })
})
