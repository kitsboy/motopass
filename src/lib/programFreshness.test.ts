import { describe, expect, it } from 'vitest'
import {
  daysSince,
  formatFreshnessLabel,
  freshnessLevel,
  resolveFreshnessDate,
} from './programFreshness'

describe('programFreshness', () => {
  const now = new Date('2026-07-15T12:00:00Z')

  it('prefers proof stamped_at over last_checked', () => {
    expect(resolveFreshnessDate('2026-05-01', '2026-07-10T04:20:27.950Z')).toBe('2026-07-10')
  })

  it('falls back to last_checked', () => {
    expect(resolveFreshnessDate('2026-06-05')).toBe('2026-06-05')
  })

  it('classifies freshness levels', () => {
    expect(freshnessLevel('2026-07-01', now)).toBe('fresh')
    expect(freshnessLevel('2026-05-15', now)).toBe('recent')
    expect(freshnessLevel('2025-01-01', now)).toBe('stale')
  })

  it('formats short month labels', () => {
    expect(formatFreshnessLabel('2026-06-05')).toBe('Jun 2026')
  })

  it('computes days since date', () => {
    expect(daysSince('2026-07-01', now)).toBe(14)
  })
})