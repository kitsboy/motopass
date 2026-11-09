import type { Program } from '../types/program'
import { toCinematicProgram } from './programAdapter'
import { buildDecisionPack, formatClocks, type FeeStance, type FilingMode } from './decisionPack'

export interface CompareFacts {
  days: number | null
  years: number | null
  daysLabel: string
  yearsLabel: string
  fee: FeeStance
  filing: FilingMode
}

export function compareFacts(program: Program): CompareFacts {
  const pack = buildDecisionPack(toCinematicProgram(program))
  const clocks = formatClocks(pack)
  return {
    days: pack.residencyDays,
    years: pack.citizenshipYears,
    daysLabel: clocks.days,
    yearsLabel: clocks.years,
    fee: pack.feeInBitcoin,
    filing: pack.filing,
  }
}
