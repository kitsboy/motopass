import { describe, expect, it } from 'vitest'
import type { Program } from '../types/program'
import catalogJson from '../../research/countries.json'
import { feeInvoice } from './feeInvoice'

function note(name: string) {
  const program = (catalogJson as { programs: Program[] }).programs.find(item => item.name === name)
  if (!program) throw new Error(name)
  return feeInvoice(program.finance.bitcoin_specific, program.finance.gov_fees_usd)
}

describe('fee invoice', () => {
  it('prices only the contribution the El Salvador note says can be paid in Bitcoin', () => {
    const invoice = note('El Salvador')
    expect(invoice.lines.find(line => line.rail === 'bitcoin')?.usd).toBe(1_000_000)
    expect(invoice.lines.find(line => line.rail === 'dollars')?.usd).toBe(5000)
  })

  it('does not turn a partial note or a source-of-funds note into a Bitcoin price', () => {
    expect(note('Argentina').lines.some(line => line.rail === 'bitcoin')).toBe(false)
    expect(note('Argentina').lines[0].rail).toBe('unpriced')
    expect(note('São Tomé and Príncipe').lines.some(line => line.rail === 'bitcoin')).toBe(false)
    expect(note('São Tomé and Príncipe').lines[0].rail).toBe('dollars')
    expect(note('Uruguay').featured).toBe(false)
  })
})
