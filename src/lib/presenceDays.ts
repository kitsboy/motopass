import type { Program } from '../types/program'
import { compareFacts } from './compareFacts'

export interface PresenceRow {
  name: string
  flag?: string
  days: number | null
}

/** Longest requirement first. Missing counts stay at the end. */
export function presenceRows(programs: Program[]): PresenceRow[] {
  return programs
    .map(program => ({
      name: program.name,
      flag: program.flag,
      days: compareFacts(program).days,
    }))
    .sort((a, b) => {
      if (a.days == null) return 1
      if (b.days == null) return -1
      return b.days - a.days
    })
}

export function presenceScale(rows: PresenceRow[]): number {
  const nums = rows.map(row => row.days).filter((days): days is number => days != null && days > 0)
  return nums.length ? Math.max(...nums) : 1
}
