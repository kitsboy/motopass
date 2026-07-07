import { describe, it, expect } from 'vitest'
import { filterPrograms, DEFAULT_FILTERS } from './programFilter'
import type { Program } from '../types/program'

const sample: Program[] = [
  {
    id: 1, name: 'El Salvador', category: 'legal_tender_bitcoin', region: 'Central America',
    status: 'Acquired', bitcoin_integration: 'Legal tender', lightning_ready: true,
    sovereignty_score: 9, stacking_synergy: 'high', risk_level: 'low',
    finance: { min_investment_usd: 0, typical_investment_usd: 30000, gov_fees_usd: 5000,
      processing_time_months: '1-4', tax_benefits: 'Favorable', crypto_friendly_score: 9, bitcoin_specific: 'BTC' },
    details: 'Bitcoin nation', last_checked: '2026-07-02',
  },
  {
    id: 2, name: 'Uruguay', category: 'rbi_cbi', region: 'South America',
    status: 'Researching', bitcoin_integration: 'Crypto friendly', lightning_ready: false,
    sovereignty_score: 8, stacking_synergy: 'medium', risk_level: 'low',
    finance: { min_investment_usd: 100000, typical_investment_usd: 150000, gov_fees_usd: 15000,
      processing_time_months: '3-8', tax_benefits: 'Territorial', crypto_friendly_score: 8, bitcoin_specific: 'Stable' },
    details: 'Territorial tax', last_checked: '2026-07-02',
  },
]

describe('programFilter', () => {
  it('filters by search and lightning', () => {
    const r = filterPrograms(sample, { ...DEFAULT_FILTERS, search: 'salvador', lightningOnly: true })
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('El Salvador')
  })

  it('filters by min investment excluding zero-min programs', () => {
    const r = filterPrograms(sample, { ...DEFAULT_FILTERS, minInvestment: 1000, maxInvestment: 2000000 })
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('Uruguay')
  })

  it('filters by max investment cap', () => {
    const r = filterPrograms(sample, { ...DEFAULT_FILTERS, minInvestment: 0, maxInvestment: 50000 })
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('El Salvador')
  })

  it('filters by region and min crypto score together', () => {
    const r = filterPrograms(sample, {
      ...DEFAULT_FILTERS,
      region: 'South America',
      minCryptoScore: 8,
    })
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('Uruguay')
  })

  it('returns empty when status substring does not match', () => {
    const r = filterPrograms(sample, { ...DEFAULT_FILTERS, status: 'Rejected' })
    expect(r).toHaveLength(0)
  })
})