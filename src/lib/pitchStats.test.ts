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
  it('derives corpus aggregates without inventing a comparator', () => {
    const stats = computePitchStats([base, { ...base, id: 2, lightning_ready: false, finance: { ...base.finance, processing_time_months: '12-18' } }])
    expect(stats.programCount).toBe(2)
    expect(stats.lightningCount).toBe(1)
    expect(Object.keys(stats)).not.toContain('costSavingsUsd')
  })

  it('keeps untraced figures out of every average', () => {
    // Nothing in this fixture carries a claim_sources entry, so no average may
    // be computed from it: an unsourced number cannot move a published figure.
    const stats = computePitchStats([base, { ...base, id: 2 }])
    expect(stats.avgTypicalInvestment).toBe(0)
    expect(stats.avgGovFees).toBe(0)
    expect(stats.avgProcessingMonths).toBe(0)
  })

  it('averages only the figures that are traced', () => {
    const traced: Program = {
      ...base,
      claim_sources: {
        'finance.typical_investment_usd': { url: 'https://example.gov/x', quote: 'fees of 200,000 US dollars', fetched: '2026-11-11' },
      },
    }
    // One traced record plus one untraced: the average is the traced figure only.
    const stats = computePitchStats([traced, { ...base, id: 2, finance: { ...base.finance, typical_investment_usd: 900000 } }])
    expect(stats.avgTypicalInvestment).toBe(200000)
  })

  it('no longer reports an average of processing times', () => {
    const metrics = pitchStatsToMetrics(computePitchStats([base]))
    expect(metrics.some(m => m.labelKey === 'pitch.metric.daysToResidency')).toBe(false)
  })

  it('counts flagship depth programs', () => {
    const stats = computePitchStats([
      { ...base, flagship_depth: true },
      { ...base, id: 2, flagship_depth: false },
    ])
    expect(stats.flagshipCount).toBe(1)
    expect(stats.deepCount).toBe(1)
    const metrics = pitchStatsToMetrics(stats)
    expect(metrics.some((m) => m.labelKey === 'pitch.metric.flagshipDepth' && m.value === 1 && m.suffix === '/2')).toBe(true)
  })

  it('excludes template tier from deep count', () => {
    const stats = computePitchStats([
      { ...base, flagship_depth: true },
      { ...base, id: 2, flagship_depth: true, flagship_tier: 'template' },
    ])
    expect(stats.flagshipCount).toBe(2)
    expect(stats.deepCount).toBe(1)
    const metrics = pitchStatsToMetrics(stats)
    expect(metrics.find((m) => m.labelKey === 'pitch.metric.flagshipDepth')).toEqual({
      label: 'Flagship depth',
      labelKey: 'pitch.metric.flagshipDepth',
      value: 1,
      suffix: '/2',
    })
  })

  it('renders flagship depth against the REAL corpus size, not a hard-coded 50', () => {
    // Regression guard: the label used to read "50/50 flagship depth" while the
    // corpus moved to 21 programs — a false claim shipped on the landing hero.
    const stats = computePitchStats([
      { ...base, flagship_depth: true },
      { ...base, id: 2, flagship_depth: true },
      { ...base, id: 3, flagship_depth: false },
    ])
    const depth = pitchStatsToMetrics(stats).find((m) => m.labelKey === 'pitch.metric.flagshipDepth')
    expect(depth?.value).toBe(2)
    expect(depth?.suffix).toBe('/3')
  })
})