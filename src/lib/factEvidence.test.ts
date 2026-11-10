import { describe, expect, it } from 'vitest'
import catalogJson from '../../research/countries.json'
import { toCinematicProgram } from './programAdapter'
import { evidenceFor, factLabel, sourceHost } from './factEvidence'
import type { Program as CinematicProgram } from '../components/programs/types'
import type { Program as DataProgram } from '../types/program'

const programs = (catalogJson as { programs: DataProgram[] }).programs
const forName = (name: string) => {
  const raw = programs.find(program => program.name === name)
  if (!raw) throw new Error(`missing ${name}`)
  return toCinematicProgram(raw)
}

const empty = (auditTrail: CinematicProgram['auditTrail']): CinematicProgram =>
  ({ id: '1', country: 'Test', countryCode: 'TT', tier: 'Residency', region: 'Test', minInvestment: 0, timelineDays: 0, sovereigntyScore: 0, proofStatus: 'pending', summary: '', auditTrail }) as CinematicProgram

describe('fact evidence', () => {
  it('returns the dated source of the row that last wrote a real fact', () => {
    const evidence = evidenceFor(forName('Bahamas'), 'days_in_country')
    expect(evidence?.date).toBe('2026-11-09')
    expect(evidence?.source).toMatch(/^https:\/\//)
  })

  it('returns no evidence when no audit row has written the fact', () => {
    expect(evidenceFor(forName('Uruguay'), 'red_flags')).toBeNull()
  })

  it('dates a fact but withholds a URL when the row names a non-URL source', () => {
    const program = empty([
      { date: '2026-08-20', field: 'pros', to: 'seeded from corpus', source: 'MotoPass corpus (BUILD 72 research)' },
    ])
    expect(evidenceFor(program, 'pros')).toEqual({ date: '2026-08-20', source: null })
  })

  it('labels keys without inventing wording and reduces URLs to a host', () => {
    expect(factLabel('crypto_tax_sentence')).toBe('crypto tax sentence')
    expect(sourceHost('https://immigration.gov.bs/applying-to-stay/')).toBe('immigration.gov.bs')
    expect(sourceHost('not a url')).toBeNull()
  })
})
