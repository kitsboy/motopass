import { describe, expect, it } from 'vitest'
import { isStubProofUrl, parseMonthsToDays, toCinematicProgram } from './programAdapter'
import { programCountryCode } from './countryCode'
import type { Program } from '../types/program'

// All 50 jurisdictions in research/countries.json — canonical countryCode
// source. If a new country is added, add it here AND to src/lib/countryCode.ts
// (the single ISO map — the adapter must never duplicate it again).
const ALL_PROGRAM_NAMES = [
  'El Salvador',
  'Central African Republic',
  'Uruguay',
  'Bolivia',
  'St. Kitts and Nevis',
  'Antigua and Barbuda',
  'Dominica',
  'UAE (Dubai / Abu Dhabi)',
  'Switzerland',
  'Singapore',
  'Portugal',
  'Malta',
  'Panama',
  'Georgia',
  'Paraguay',
  'Costa Rica',
  'Hong Kong',
  'Thailand',
  'Mexico',
  'Cyprus',
  'Greece',
  'Vanuatu',
  'Turkey',
  'Mauritius',
  'Seychelles',
  'Brazil',
  'Argentina',
  'Chile',
  'Colombia',
  'St. Lucia',
  'Grenada',
  'Barbados',
  'Bahamas',
  'Belize',
  'Cambodia',
  'Philippines',
  'Malaysia',
  'Indonesia',
  'Japan',
  'New Zealand',
  'Ireland',
  'Spain',
  'Italy',
  'Latvia',
  'Estonia',
  'Bulgaria',
  'Croatia',
  'Gibraltar',
  'Cayman Islands',
  'Andorra',
]

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

describe('proofStatus honesty', () => {
  it('marks allowlisted non-stub URL as recorded, not verified', () => {
    const withUrl = {
      ...baseProgram,
      satohash_proofs: [{ proof_url: 'https://satohash.io/verify/deadbeefcafebabe', block_height: 800000 }],
    }
    expect(toCinematicProgram(withUrl).proofStatus).toBe('recorded')
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

describe('countryCode single source of truth', () => {
  it('every program name resolves an ISO code via the shared module', () => {
    expect(ALL_PROGRAM_NAMES).toHaveLength(50)
    for (const name of ALL_PROGRAM_NAMES) {
      const code = programCountryCode(name)
      // No name may fall through to the initials guess — that produced
      // CA (Canada) for Central African Republic.
      expect(code, `${name} must resolve via the ISO map, got ${code}`).toMatch(/^[A-Z]{2}$/)
    }
  })

  it('adapter countryCode matches the shared module (no drift possible)', () => {
    for (const name of ALL_PROGRAM_NAMES) {
      const p = toCinematicProgram({ ...baseProgram, name })
      expect(p.countryCode, name).toBe(programCountryCode(name))
    }
  })
})