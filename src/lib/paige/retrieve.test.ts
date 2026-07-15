import { describe, it, expect } from 'vitest'
import { retrievePrograms } from './retrieve'
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
  flagship_depth: true,
  paige_fields: {
    common_questions: ['Can I keep foreign crypto gains tax-free?'],
    red_flags: [],
    optimization_tips: ['Use real estate investment'],
    escalate_when: 'Complex tax',
  },
}

describe('retrievePrograms', () => {
  it('finds Uruguay for mercosur query', () => {
    const hits = retrievePrograms([uruguay], 'Uruguay crypto tax')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].program.name).toBe('Uruguay')
  })
})