import { describe, it, expect } from 'vitest'
import { computePitchStats, pitchStatsToMetrics } from './pitchStats'
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

  it('counts flagship depth programs', () => {
    const stats = computePitchStats([
      { ...base, flagship_depth: true },
      { ...base, id: 2, flagship_depth: false },
    ])
    expect(stats.flagshipCount).toBe(1)
    expect(stats.deepCount).toBe(1)
    const metrics = pitchStatsToMetrics(stats)
    expect(metrics.some((m) => m.label === '50/50 flagship depth' && m.value === 1 && m.suffix === '/2')).toBe(true)
  })

  it('excludes template tier from deep count', () => {
    const stats = computePitchStats([
      { ...base, flagship_depth: true },
      { ...base, id: 2, flagship_depth: true, flagship_tier: 'template' },
    ])
    expect(stats.flagshipCount).toBe(2)
    expect(stats.deepCount).toBe(1)
    const metrics = pitchStatsToMetrics(stats)
    expect(metrics.find((m) => m.label === '50/50 flagship depth')).toEqual({
      label: '50/50 flagship depth',
      value: 1,
      suffix: '/2',
    })
  })
})