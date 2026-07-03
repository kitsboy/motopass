import { describe, it, expect } from 'vitest'
import { computePitchStats } from './pitchStats'
import type { Program } from '../types/program'

const base: Program = {
  id: 1,
  name: 'Test',
  category: 'rbi_cbi',
  region: 'Americas',
  status: 'Researching',
  bitcoin_integration: 'BTC',
  lightning_ready: true,
  sovereignty_score: 8,
  finance: {
    min_investment_usd: 100000,
    typical_investment_usd: 200000,
    gov_fees_usd: 10000,
    processing_time_months: '6-12',
    tax_benefits: 'Territorial',
    crypto_friendly_score: 8,
    bitcoin_specific: 'Lightning',
  },
  details: 'Test',
  last_checked: '2026-07-02',
}

describe('computePitchStats', () => {
  it('derives savings from program aggregates', () => {
    const stats = computePitchStats([base, { ...base, id: 2, lightning_ready: false, finance: { ...base.finance, processing_time_months: '12-18' } }])
    expect(stats.programCount).toBe(2)
    expect(stats.traditionalAdvisoryUsd).toBeGreaterThan(stats.motopassAdvisoryUsd)
    expect(stats.costSavingsUsd).toBeGreaterThan(0)
    expect(stats.timeSavingsMonths).toBeGreaterThan(0)
  })
})