import { describe, expect, it } from 'vitest'
import type { Program as DataProgram } from '../types/program'
import catalogJson from '../../research/countries.json'
import { toCinematicProgram } from './programAdapter'
import { buildDecisionPack, formatClocks } from './decisionPack'

const catalog = catalogJson as { programs: DataProgram[] }

function packFor(name: string) {
  const raw = catalog.programs.find(program => program.name === name)
  if (!raw) throw new Error(`missing ${name}`)
  return { raw, cinematic: toCinematicProgram(raw), pack: buildDecisionPack(toCinematicProgram(raw)) }
}

describe('decision pack', () => {
  it('keeps Uruguay on the raw processing range and the clocks already on file', () => {
    const { pack } = packFor('Uruguay')
    const clocks = formatClocks(pack)
    expect(pack.processingMonths).toBe('3-8')
    expect(clocks.process).toBe('3-8 mo')
    expect(clocks.days).toBe('1,095d')
    expect(clocks.years).toBe('4y')
    expect(clocks.renewal).toBe('36 mo')
    expect(pack.feeInBitcoin).toBe('no')
    expect(pack.mobilityNote).toMatch(/170/)
    // Henley Sept 2026: 155 visa-free destinations → round(155 / 20).
    expect(pack.mobilityScore).toBe(8)
    expect(pack.bankingScore).toBeNull()
    expect(pack.bankingNote).toBeNull()
    expect(pack.filing).toBe('unknown')
    expect(pack.announced).toBe(false)
    expect(pack.routes.every(route => route.holding == null && route.family.length === 0)).toBe(true)
  })

  it('keeps Argentina citizenship-by-investment announced, with the family prices already in the note', () => {
    const { raw, cinematic, pack } = packFor('Argentina')
    const announced = pack.routes.filter(route => route.status === 'announced')
    expect(announced).toHaveLength(1)
    expect(announced[0].minUsd).toBe(350000)
    expect(announced[0].refundable).toBe('partial')
    expect(announced[0].holding).toMatch(/Holding period is not on file/)
    expect(announced[0].family).toEqual([
      { who: 'Spouse', usd: 100000, included: false },
      { who: 'Children 18–25', usd: 100000, included: false },
      { who: 'Children under 18', usd: 25000, included: false },
    ])
    expect(pack.announced).toBe(true)
    expect(pack.filing).toBe('in_country')
    expect(pack.feeInBitcoin).toBe('partial')
    expect(cinematic.minInvestment).toBe(raw.finance.min_investment_usd)
    expect(cinematic.minInvestment).toBe(50000)
  })

  it('treats El Salvador Bitcoin fees as partial and includes the Freedom Visa family', () => {
    const { pack } = packFor('El Salvador')
    const visa = pack.routes.find(route => /freedom visa/i.test(route.label))
    expect(pack.feeInBitcoin).toBe('partial')
    expect(pack.processingMonths).toBe('1-4')
    expect(formatClocks(pack).days).toBe('365d')
    expect(formatClocks(pack).years).toBe('5y')
    expect(visa?.family).toEqual([
      { who: 'Spouse', usd: null, included: true },
      { who: 'Children under 18', usd: null, included: true },
    ])
    expect(visa?.capPerYear).toBe('1,000')
    expect(pack.routes.every(route => route.status === 'live')).toBe(true)
    // Henley Sept 2026: 131 visa-free destinations → round(131 / 20).
    expect(pack.mobilityScore).toBe(7)
    expect(pack.bankingScore).toBeNull()
  })

  it('reads São Tomé zero clocks as none and at grant, and keeps the remote filing', () => {
    const { pack } = packFor('São Tomé and Príncipe')
    const clocks = formatClocks(pack)
    expect(pack.residencyDays).toBe(0)
    expect(pack.citizenshipYears).toBe(0)
    expect(clocks.days).toBe('None')
    expect(clocks.years).toBe('At grant')
    expect(clocks.renewal).toBe('None')
    expect(pack.filing).toBe('remote')
    expect(pack.feeInBitcoin).toBe('partial')
    // Henley Sept 2026: 58 visa-free destinations → round(58 / 20).
    expect(pack.mobilityScore).toBe(3)
    expect(pack.bankingScore).toBe(3)
    expect(pack.routes[0].family).toEqual([
      { who: 'Additional dependent', usd: 5000, included: false },
    ])
  })

  it('does not close a live route because a different route is mentioned as closed', () => {
    const { pack } = packFor('Malta')
    expect(pack.routes.every(route => route.status === 'live')).toBe(true)
    expect(pack.announced).toBe(false)
  })

  it('marks only the pathway whose own note says it is the post-reform route', () => {
    const { pack } = packFor('Portugal')
    const golden = pack.routes.find(route => /golden visa/i.test(route.label))
    expect(golden?.status).toBe('reformed')
    expect(pack.routes.filter(route => route.status === 'reformed')).toHaveLength(1)
    expect(pack.announced).toBe(false)
  })

  it('gives every curated country the same slots without a catalog edit', () => {
    expect(catalog.programs).toHaveLength(21)
    for (const raw of catalog.programs) {
      const pack = buildDecisionPack(toCinematicProgram(raw))
      expect(pack.routes).toHaveLength(raw.pathways?.length ?? 0)
      expect(['yes', 'no', 'partial', 'unknown']).toContain(pack.feeInBitcoin)
      expect(['in_country', 'remote', 'unknown']).toContain(pack.filing)
      expect(pack.mobilityScore === null || (pack.mobilityScore >= 0 && pack.mobilityScore <= 10)).toBe(true)
      expect(pack.bankingScore === null || (pack.bankingScore >= 0 && pack.bankingScore <= 10)).toBe(true)
    }
  })
})
