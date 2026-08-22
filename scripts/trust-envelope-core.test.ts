import { describe, expect, it } from 'vitest'
import {
  freshnessFromDate,
  tierForSource,
  thresholdHistoryFromAudit,
} from './lib/trust-envelope-core.mjs'

describe('trust-envelope-core honesty contract', () => {
  const now = new Date('2026-08-22T12:00:00Z')

  it('marks fresh <=30d, watch 31-45d, stale >45d', () => {
    expect(freshnessFromDate('2026-08-20', now).status).toBe('fresh')
    expect(freshnessFromDate('2026-08-01', now).status).toBe('fresh')
    expect(freshnessFromDate('2026-07-10', now).status).toBe('watch')
    expect(freshnessFromDate('2026-06-01', now).status).toBe('stale')
  })

  it('never reports fresh without a verification date (no fabrication)', () => {
    expect(freshnessFromDate(null, now)).toEqual({
      status: 'stale',
      days_stale: null,
      verified_at: null,
    })
  })

  it('computes honest days_stale', () => {
    expect(freshnessFromDate('2026-07-02', now).days_stale).toBe(51)
    expect(freshnessFromDate('2026-08-22', now).days_stale).toBe(0)
  })

  it('classifies official sources by regulator keyword', () => {
    expect(tierForSource('Official CBI')).toBe('official')
    expect(tierForSource('Greek MFA')).toBe('official')
    expect(tierForSource('IMF Country Report 25/58')).toBe('official')
    expect(tierForSource('Reuters (2025-01-30)')).toBe('secondary')
  })

  it('classifies legal sources by legislation keyword', () => {
    expect(tierForSource('Immigration Act 2020')).toBe('legal')
    expect(tierForSource('Digital Nomad Regulations')).toBe('legal')
  })

  it('only seeds history from real audit entries', () => {
    const audit = [
      { date: '2026-08-01', field: 'finance.min_investment_usd', from: '100,000', to: '150,000' },
      { date: '2026-08-02', field: 'proof', from: 'a', to: 're-anchored' },
    ]
    const h = thresholdHistoryFromAudit(audit, 150000)
    expect(h).toHaveLength(1)
    expect(h[0].usd).toBe(150000)
  })

  it('seeds a single honest current point when no history exists', () => {
    const h = thresholdHistoryFromAudit([], 250000)
    expect(h).toHaveLength(1)
    expect(h[0].usd).toBe(250000)
    expect(h[0].field).toBe('current')
  })

  it('does not fabricate a series from unrelated audit entries', () => {
    const audit = [{ date: '2026-08-02', field: 'proof', from: 'a', to: 're-anchored' }]
    const h = thresholdHistoryFromAudit(audit, 100000)
    expect(h).toHaveLength(1)
    expect(h[0].field).toBe('current')
    expect(h[0].date).toBeNull()
  })
})
