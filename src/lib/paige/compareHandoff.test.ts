import { describe, it, expect } from 'vitest'
import { compareHandoffPath, isCompareIntent, resolveCompareHandoff } from './compareHandoff'
import type { Program } from '../../types/program'

const uruguay: Program = {
  id: 3,
  name: 'Uruguay',
  category: 'rbi_cbi',
  region: 'South America',
  status: 'Flagship',
  bitcoin_integration: 'BTC',
  finance: {
    min_investment_usd: 100000,
    typical_investment_usd: 150000,
    gov_fees_usd: 15000,
    processing_time_months: '3-8',
    tax_benefits: 'Territorial',
    crypto_friendly_score: 8,
    bitcoin_specific: 'Lightning',
  },
  details: 'Mercosur residency',
  last_checked: '2026-07-14',
}

const uae: Program = {
  ...uruguay,
  id: 7,
  name: 'UAE',
  region: 'Middle East',
}

describe('compareHandoff', () => {
  it('detects compare intent', () => {
    expect(isCompareIntent('compare Uruguay and UAE')).toBe(true)
    expect(isCompareIntent('compare these two')).toBe(true)
    expect(isCompareIntent('Uruguay tax')).toBe(false)
  })

  it('resolves ids from query', () => {
    const ids = resolveCompareHandoff('compare Uruguay UAE', [uruguay, uae])
    expect(ids).toEqual([3, 7])
  })

  it('falls back to prior hit ids for "these two"', () => {
    const ids = resolveCompareHandoff('compare these two', [uruguay, uae], [3, 7])
    expect(ids).toEqual([3, 7])
  })

  it('builds compare path', () => {
    expect(compareHandoffPath([3, 7])).toBe('/compare?ids=3,7')
  })
})