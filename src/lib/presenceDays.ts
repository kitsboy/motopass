import type { Program } from '../types/program'
import { compareFacts } from './compareFacts'

export interface PresenceRow {
  name: string
  flag?: string
  days: number | null
  sentence: string | null
  url: string | null
}

function daySentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

/** A sentence counts only when it states this day count, not a shorter number inside it. */
function mentionsDayCount(sentence: string, days: number): boolean {
  const tokens = sentence.match(/\d[\d,]*/g) ?? []
  const plain = String(days)
  const grouped = days.toLocaleString('en-US')
  if (tokens.some(token => token === plain || token === grouped)) return true
  return new RegExp(`\\b${days}[- ]days?\\b`, 'i').test(sentence)
}

/**
 * The receipt is a sentence already in the notes, plus an official https URL
 * already on the program. A missing sentence stays missing.
 */
export function presenceReceipt(program: Program): { sentence: string | null; url: string | null } {
  const days = compareFacts(program).days
  const url = (program.legal_compliance?.official_urls ?? []).find(item => /^https:\/\//i.test(item)) ?? null
  if (days == null) return { sentence: null, url }
  const blob = [
    program.critical_tests?.notes,
    ...(program.pathways ?? []).map(pathway => pathway.notes),
    program.legal_compliance?.recent_changes,
    program.details,
  ]
    .filter(Boolean)
    .join(' ')
  const sentence = daySentences(blob).find(item => mentionsDayCount(item, days)) ?? null
  return { sentence, url }
}

/** Longest requirement first. Missing counts stay at the end. */
export function presenceRows(programs: Program[]): PresenceRow[] {
  return programs
    .map(program => {
      const receipt = presenceReceipt(program)
      return {
        name: program.name,
        flag: program.flag,
        days: compareFacts(program).days,
        sentence: receipt.sentence,
        url: receipt.url,
      }
    })
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
