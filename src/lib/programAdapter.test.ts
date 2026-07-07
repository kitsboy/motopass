import { describe, expect, it } from 'vitest'
import { isStubProofUrl, parseMonthsToDays, toCinematicProgram } from './programAdapter'
import type { Program } from '../types/program'

const baseProgram: Program = {
  id: 1,
  name: 'Uruguay',
  region: 'Americas',
  category: 'residency_by_investment',
  flag: '🇺🇾',
  details: 'Test program',
  sovereignty_score: 8.5,
  risk_level: 'low',
  lightning_ready: true,
  finance: {
    min_investment_usd: 100000,
    typical_investment_usd: 150000,
    processing_time_months: '6-12',
    crypto_friendly_score: 9,
  },
  satohash_proofs: [],
}

describe('parseMonthsToDays', () => {
  it('parses ranges', () => {
    expect(parseMonthsToDays('6-12')).toBe(270)
  })
  it('parses single month', () => {
    expect(parseMonthsToDays('3')).toBe(90)
  })
})

describe('isStubProofUrl', () => {
  it('detects placeholder hashes', () => {
    expect(isStubProofUrl('https://satohash.io/verify/aaaaaaaaaaaa')).toBe(true)
  })
  it('accepts real-looking urls', () => {
    expect(isStubProofUrl('https://satohash.io/verify/deadbeefcafebabe')).toBe(false)
  })
})

describe('toCinematicProgram', () => {
  it('maps sovereignty to 0-100 scale', () => {
    const p = toCinematicProgram(baseProgram)
    expect(p.sovereigntyScore).toBe(85)
  })
  it('marks missing proof as pending', () => {
    expect(toCinematicProgram(baseProgram).proofStatus).toBe('pending')
  })
  it('marks stub proof as demo', () => {
    const withStub = {
      ...baseProgram,
      satohash_proofs: [{ proof_url: 'https://satohash.io/verify/aaaa1111bbbb2222', block_height: 800000 }],
    }
    expect(toCinematicProgram(withStub).proofStatus).toBe('demo')
  })
})