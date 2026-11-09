import { describe, expect, it } from 'vitest'
import type { Program } from '../types/program'
import catalogJson from '../../research/countries.json'
import { compareFacts } from './compareFacts'

function facts(name: string) {
  const program = (catalogJson as { programs: Program[] }).programs.find(item => item.name === name)
  if (!program) throw new Error(name)
  return compareFacts(program)
}

describe('compare facts', () => {
  it('puts the three clocks and the filing stance on one line of facts', () => {
    const uruguay = facts('Uruguay')
    expect(uruguay.daysLabel).toBe('1,095d')
    expect(uruguay.yearsLabel).toBe('4y')
    expect(uruguay.fee).toBe('no')
    expect(uruguay.filing).toBe('unknown')

    const salvador = facts('El Salvador')
    expect(salvador.daysLabel).toBe('365d')
    expect(salvador.yearsLabel).toBe('5y')
    expect(salvador.fee).toBe('partial')

    const sao = facts('São Tomé and Príncipe')
    expect(sao.daysLabel).toBe('None')
    expect(sao.yearsLabel).toBe('At grant')
    expect(sao.filing).toBe('remote')
  })
})
