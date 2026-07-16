import { describe, it, expect } from 'vitest'
import { formatStackSummary } from './simulatorSummary'
import type { Program } from '../types/program'

const base: Program = {
  id: 1,
  name: 'Uruguay',
  category: 'rbi_cbi',
  region: 'South America',
  status: 'Researching',
  bitcoin_integration: 'Crypto friendly',
  lightning_ready: true,
  sovereignty_score: 8,
  stacking_synergy: 'high',
  risk_level: 'low',
  finance: {
    min_investment_usd: 100000,
    typical_investment_usd: 150000,
    gov_fees_usd: 15000,
    processing_time_months: '3-8',
    tax_benefits: 'Territorial',
    crypto_friendly_score: 8,
    bitcoin_specific: 'Stable',
  },
  details: 'Territorial tax',
  last_checked: '2026-07-02',
}

describe('formatStackSummary', () => {
  it('formats empty stack', () => {
    expect(formatStackSummary([])).toContain('empty')
  })

  it('includes program names and metrics', () => {
    const text = formatStackSummary([base, { ...base, id: 2, name: 'Bolivia', sovereignty_score: 7 }])
    expect(text).toContain('Uruguay')
    expect(text).toContain('Bolivia')
    expect(text).toContain('$300,000')
    expect(text).toContain('Avg sovereignty: 8/10')
  })
})