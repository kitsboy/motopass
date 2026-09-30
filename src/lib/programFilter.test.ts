import { describe, it, expect } from 'vitest'
import { filterPrograms, DEFAULT_FILTERS } from './programFilter'
import type { Program } from '../types/program'
import catalogJson from '../../research/countries.json'

const sample: Program[] = [
  {
    id: 1, name: 'El Salvador', category: 'legal_tender_bitcoin', region: 'Central America',
    status: 'Acquired', bitcoin_integration: 'Legal tender', lightning_ready: true,
    sovereignty_score: 9, stacking_synergy: 'high', risk_level: 'low',
    finance: { min_investment_usd: 0, typical_investment_usd: 30000, gov_fees_usd: 5000,
      processing_time_months: '1-4', tax_benefits: 'Favorable', crypto_friendly_score: 9, bitcoin_specific: 'BTC' },
    details: 'Bitcoin nation', last_checked: '2026-07-02',
    highlight_btc_friendly: true, policy_mentions_btc: false,
  },
  {
    id: 2, name: 'Uruguay', category: 'rbi_cbi', region: 'South America',
    status: 'Researching', bitcoin_integration: 'Crypto friendly', lightning_ready: false,
    sovereignty_score: 8, stacking_synergy: 'medium', risk_level: 'low',
    finance: { min_investment_usd: 100000, typical_investment_usd: 150000, gov_fees_usd: 15000,
      processing_time_months: '3-8', tax_benefits: 'Territorial', crypto_friendly_score: 8, bitcoin_specific: 'Stable' },
    details: 'Territorial tax', last_checked: '2026-07-02',
    highlight_btc_friendly: false, policy_mentions_btc: true,
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

  it('filters by curated Bitcoin-friendly and policy flags independently', () => {
    const friendly = filterPrograms(sample, { ...DEFAULT_FILTERS, bitcoinTier: 'friendly' })
    const policy = filterPrograms(sample, { ...DEFAULT_FILTERS, bitcoinTier: 'policy' })
    expect(friendly.map((program) => program.name)).toEqual(['El Salvador'])
    expect(policy.map((program) => program.name)).toEqual(['Uruguay'])
  })

  it('allows a program to appear in both curated BTC tiers', () => {
    const overlap = { ...sample[0], highlight_btc_friendly: true, policy_mentions_btc: true }
    expect(filterPrograms([overlap], { ...DEFAULT_FILTERS, bitcoinTier: 'friendly' })).toEqual([overlap])
    expect(filterPrograms([overlap], { ...DEFAULT_FILTERS, bitcoinTier: 'policy' })).toEqual([overlap])
  })

  it('filters by sovereignty score range', () => {
    const r = filterPrograms(sample, { ...DEFAULT_FILTERS, minSovereignty: 9, maxSovereignty: 10 })
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('El Salvador')
  })
})

/**
 * Regression guard: the unfiltered /programs view must show the WHOLE catalog.
 * A default cost cap previously hid Singapore ($7.5M GIP) from every visitor.
 * If someone re-introduces a narrowing default, this fails loudly.
 */
describe('DEFAULT_FILTERS hide nothing', () => {
  const catalog = (catalogJson as unknown as { programs: Program[] }).programs

  it('loads the real catalog', () => {
    expect(catalog.length).toBeGreaterThan(0)
  })

  it('returns every program in the catalog (no hidden cards)', () => {
    const out = filterPrograms(catalog, DEFAULT_FILTERS)
    const hidden = catalog.filter((p) => !out.includes(p)).map((p) => p.name)
    expect(hidden).toEqual([])
  })

  it('matches curated BTC tier filter counts to the source flags', () => {
    const friendlyCount = catalog.filter((program) => program.highlight_btc_friendly === true).length
    const policyCount = catalog.filter((program) => program.policy_mentions_btc === true).length
    expect(filterPrograms(catalog, { ...DEFAULT_FILTERS, bitcoinTier: 'friendly' })).toHaveLength(friendlyCount)
    expect(filterPrograms(catalog, { ...DEFAULT_FILTERS, bitcoinTier: 'policy' })).toHaveLength(policyCount)
    expect(friendlyCount).toBeGreaterThan(0)
    expect(policyCount).toBeGreaterThan(0)
  })

  it('the default cost cap covers the most expensive program', () => {
    const max = Math.max(...catalog.map((p) => p.finance?.min_investment_usd ?? 0))
    expect(DEFAULT_FILTERS.maxInvestment).toBeGreaterThanOrEqual(max)
  })
})