import { describe, expect, it } from 'vitest'
import {
  daysSince,
  freshnessStatus,
  derivePros,
  deriveCons,
  deriveScorecard,
  CORPUS_SOURCE,
} from './lib/derive-intel.mjs'
import { canonicalSlice, canonicalSliceHash } from './lib/canonical-slice.mjs'
import { buildIntel } from './update-freshness.mjs'

const baseProgram = {
  id: 1,
  name: 'Testland',
  category: 'rbi_cbi',
  region: 'Test',
  status: 'Acquired',
  bitcoin_integration: 'Crypto friendly.',
  finance: {
    min_investment_usd: 100000,
    typical_investment_usd: 150000,
    gov_fees_usd: 15000,
    processing_time_months: '3-8',
    tax_benefits: 'No capital gains tax. Territorial tax system.',
    crypto_friendly_score: 8,
    bitcoin_specific: 'Great for Bitcoin holders and businesses.',
  },
  details: 'Test details.',
  last_checked: '2026-08-01',
  sources: ['Official'],
  flag: '🇹🇹',
  lightning_ready: true,
  sovereignty_score: 9,
  stacking_synergy: 'high',
  risk_level: 'low',
  flagship_depth: true,
  pathways: [{ type: 'real_estate', label: 'Real estate', min_investment_usd: 100000, notes: 'Allowed' }],
  critical_tests: { live_and_work: true, scope_of_freedom: true, dual_citizenship: true, notes: 'x' },
  legal_compliance: {
    primary_laws: ['Ley Test'],
    official_urls: ['https://example.gov'],
    property_foreign_ownership: 'Allowed',
    recent_changes: 'None',
  },
  compliance_clock: { renewal_interval_months: 12, citizenship_eligibility_years: 5, residency_day_count_target: 365 },
  paige_fields: {
    common_questions: ['Q1'],
    red_flags: ['Verify current thresholds', 'Watch source-of-funds scrutiny'],
    optimization_tips: ['Use the RE route for speed'],
    escalate_when: 'Big deals',
  },
  satohash_proofs: [
    {
      field: 'program_snapshot',
      block_height: 958093,
      proof_url: `https://satohash.io/verify/${'a1'.repeat(32)}`,
      content_hash: 'a1'.repeat(32),
    },
  ],
}

describe('freshness', () => {
  it('classifies fresh/watch/stale by thresholds', () => {
    expect(freshnessStatus(0)).toBe('fresh')
    expect(freshnessStatus(14)).toBe('fresh')
    expect(freshnessStatus(15)).toBe('watch')
    expect(freshnessStatus(45)).toBe('watch')
    expect(freshnessStatus(46)).toBe('stale')
    expect(freshnessStatus(null)).toBe('stale')
  })

  it('daysSince is clamped at zero and null-safe', () => {
    expect(daysSince('2026-08-01', new Date('2026-08-20').getTime())).toBe(19)
    expect(daysSince('2026-08-25', new Date('2026-08-20').getTime())).toBe(0)
    expect(daysSince(null)).toBeNull()
  })
})

describe('derivation honesty', () => {
  it('pros come only from vetted fields and carry source + verified_at', () => {
    const pros = derivePros(baseProgram)
    expect(pros.length).toBeGreaterThanOrEqual(3)
    expect(pros[0].text).toContain('live and work')
    expect(pros.every(p => p.source === CORPUS_SOURCE)).toBe(true)
    expect(pros.every(p => p.verified_at === '2026-08-01')).toBe(true)
  })

  it('cons mirror red flags and negative critical tests with source tags', () => {
    const risky = { ...baseProgram, risk_level: 'high', critical_tests: { ...baseProgram.critical_tests, dual_citizenship: false } }
    const cons = deriveCons(risky)
    expect(cons.some(c => c.text.includes('Dual citizenship not available'))).toBe(true)
    expect(cons.some(c => c.text.includes('High risk profile'))).toBe(true)
    expect(cons.some(c => c.text.includes('Verify current thresholds'))).toBe(true)
    expect(cons.every(c => c.source === CORPUS_SOURCE)).toBe(true)
  })

  it('scorecard derives known metrics and keeps unknowns honest-null', () => {
    const sc = deriveScorecard(baseProgram)
    expect(sc.crypto_friendly).toBe(8)
    expect(sc.freedom).toBe(9)
    expect(sc.stability).toBe(9)
    expect(sc.tax).toBe(9) // "no capital gains"
    expect(sc.mobility).toBeNull()
    expect(sc.banking).toBeNull()
  })

  it('cost score favors cheaper entry points', () => {
    const cheap = deriveScorecard({ ...baseProgram, finance: { ...baseProgram.finance, min_investment_usd: 0 } })
    const pricey = deriveScorecard({ ...baseProgram, finance: { ...baseProgram.finance, min_investment_usd: 5000000 } })
    expect(cheap.cost).toBe(10)
    expect(pricey.cost!).toBeLessThan(cheap.cost!)
  })
})

describe('canonical slice', () => {
  it('is deterministic and excludes schema v3 blocks', () => {
    const withIntel = {
      ...baseProgram,
      pros: [{ text: 'x', source: 's' }],
      freshness: { status: 'stale', days_stale: 90 },
      audit_trail: [{ date: '2026-08-20', field: 'schema.v3', to: 'x' }],
    }
    expect(canonicalSlice(withIntel)).toBe(canonicalSlice(baseProgram))
  })

  it('includes last_checked but not intel metadata', () => {
    const a = { ...baseProgram, last_checked: '2026-08-01' }
    const b = { ...baseProgram, last_checked: '2026-08-19' }
    expect(canonicalSliceHash(a)).not.toBe(canonicalSliceHash(b))
  })
})

describe('intel manifest', () => {
  it('builds a valid manifest with 50-program coverage shape', () => {
    const data = { programs: [baseProgram, { ...baseProgram, id: 2, name: 'Testland2' }] }
    const intel = buildIntel(data, { now: new Date('2026-08-20').getTime(), nowIso: '2026-08-20T00:00:00.000Z' })
    expect(intel.schema).toBe('motopass.country-intel.v1')
    expect(intel.programs.Testland.freshness.status).toBe('watch') // 19d: >14d, ≤45d
    expect(intel.programs.Testland.proof.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(typeof intel.programs.Testland.proof.in_sync).toBe('boolean')
    expect(Array.isArray(intel.programs.Testland.recent_changes)).toBe(true)
    expect(intel.sweep.watch).toBe(2)
    expect(intel.sweep.stale).toBe(0)
  })
})
