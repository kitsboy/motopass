import type { Program } from '../components/programs/types'
import type { ProgramPathway } from '../types/program'

/**
 * Display model for the programs card, table, and modal.
 * Reads the cinematic program only. It does not edit research/countries.json
 * or any Satohash slice field.
 */

export type RouteStatus = 'live' | 'reformed' | 'announced' | 'closed'
export type FeeStance = 'yes' | 'no' | 'partial' | 'unknown'
export type FilingMode = 'in_country' | 'remote' | 'unknown'
export type Refundable = 'yes' | 'no' | 'partial'

export interface FamilyPrice {
  who: string
  /** Null when the note says the person is included and states no separate price. */
  usd: number | null
  included: boolean
}

export interface RouteLine {
  label: string
  status: RouteStatus
  minUsd: number
  holding: string | null
  refundable: Refundable | null
  family: FamilyPrice[]
  /** Present only when the pathway note states a numeric applicant cap. */
  capPerYear: string | null
}

export interface DecisionPack {
  processingMonths: string | null
  /** Null when the country has no compliance clock. Zero is a real "no day target". */
  residencyDays: number | null
  /** Null when unknown. Zero means citizenship at grant. */
  citizenshipYears: number | null
  renewalMonths: number | null
  routes: RouteLine[]
  feeInBitcoin: FeeStance
  feeNote: string | null
  cryptoTaxNote: string | null
  filing: FilingMode
  mobilityNote: string | null
  mobilityScore: number | null
  bankingNote: string | null
  bankingScore: number | null
  announced: boolean
}

export interface ClockWords {
  missing: string
  none: string
  atGrant: string
  mo: string
  day: string
  year: string
}

export const EN_CLOCK_WORDS: ClockWords = {
  missing: 'Not on file',
  none: 'None',
  atGrant: 'At grant',
  mo: 'mo',
  day: 'd',
  year: 'y',
}

const ANNOUNCED_RE = /announced|not yet live|not yet in force/i
const REFORMED_RE = /\bpost-[\w-]*reform\b/i
const REMOTE_RE = /fully remote|no physical|no residence/i
const IN_COUNTRY_RE = /in-country|in country|must apply in/i
const HOLD_RE = /(\d+\s*[–-]\s*\d+|\d+)\s*-?\s*year hold/i

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function clip(text: string, max = 220): string {
  const flat = clean(text)
  if (flat.length <= max) return flat
  return `${flat.slice(0, max - 1).trimEnd()}…`
}

function firstSentence(text: string): string {
  const flat = clean(text)
  const cut = flat.split(/(?<=\.)\s/)[0] ?? flat
  return clip(cut)
}

export function feeStance(text: string | null | undefined): FeeStance {
  const value = (text ?? '').trim()
  if (!value) return 'unknown'
  if (/^(?:partial(?:ly)?|indirect)\b/i.test(value)) return 'partial'
  if (/^yes\b/i.test(value)) {
    if (/\bonly\b/i.test(value.slice(0, 240))) return 'partial'
    return 'yes'
  }
  if (/^no\b/i.test(value)) return 'no'
  return 'unknown'
}

function routeStatus(pathway: ProgramPathway): RouteStatus {
  const text = `${pathway.label} ${pathway.notes}`
  if (ANNOUNCED_RE.test(text)) return 'announced'
  if (REFORMED_RE.test(text)) return 'reformed'
  return 'live'
}

function refundableOf(notes: string): Refundable | null {
  const nonRefundable = /non-refundable/i.test(notes)
  const bondPurchase = /\bbond\b/i.test(notes)
  if (nonRefundable && bondPurchase) return 'partial'
  if (nonRefundable) return 'no'
  if (/\brefundable\b/i.test(notes)) return 'yes'
  return null
}

function holdingOf(notes: string): string | null {
  const hold = notes.match(HOLD_RE)
  if (hold) return clean(hold[0])
  if (/non-refundable/i.test(notes) && /\bbond\b/i.test(notes)) {
    return 'Contribution described as non-refundable. Bond is a purchase. Holding period is not on file.'
  }
  return null
}

function money(raw: string): number {
  return Number(raw.replace(/,/g, ''))
}

function familyFromNotes(notes: string): FamilyPrice[] {
  const family: FamilyPrice[] = []
  if (/spouse and children under 18 included/i.test(notes)) {
    family.push({ who: 'Spouse', usd: null, included: true })
    family.push({ who: 'Children under 18', usd: null, included: true })
  }
  const spouse = notes.match(/spouse\s+(?:US\$|USD)\s*([\d,]+)/i)
  if (spouse) family.push({ who: 'Spouse', usd: money(spouse[1]), included: false })
  const older = notes.match(/kids\s+18\s*[-–]\s*25\b[^.;]{0,80}?(?:US\$|USD)\s*([\d,]+)/i)
  if (older) family.push({ who: 'Children 18–25', usd: money(older[1]), included: false })
  const young = notes.match(/kids under 18\s+(?:US\$|USD)\s*([\d,]+)/i)
  if (young) family.push({ who: 'Children under 18', usd: money(young[1]), included: false })
  const extra = notes.match(/(?:USD|US\$)\s*~?\s*([\d,]+)\s*per additional dependent/i)
  if (extra) family.push({ who: 'Additional dependent', usd: money(extra[1]), included: false })
  const flat = notes.match(/family of up to (\d+)/i)
  if (flat && /\bflat\b/i.test(notes) && !/add-ons increase|family tiers increase/i.test(notes)) {
    family.push({ who: `Family of up to ${flat[1]}`, usd: null, included: true })
  }
  return family
}

function capPerYear(notes: string): string | null {
  const cap = notes.match(/capped at ([\d,]+) main applicants/i)
  return cap ? cap[1] : null
}

function routeLine(pathway: ProgramPathway): RouteLine {
  return {
    label: pathway.label,
    status: routeStatus(pathway),
    minUsd: pathway.min_investment_usd,
    holding: holdingOf(pathway.notes),
    refundable: refundableOf(pathway.notes),
    family: familyFromNotes(pathway.notes),
    capPerYear: capPerYear(pathway.notes),
  }
}

function cryptoTaxNote(taxBenefits: string | undefined): string | null {
  if (!taxBenefits) return null
  const match = taxBenefits.match(/Crypto\/Bitcoin tax:\s*([\s\S]+)/i)
  if (!match) return null
  const note = clip(match[1])
  return note || null
}

function filingOf(program: Program): FilingMode {
  const blob = [program.criticalTests?.notes ?? '', ...(program.pathways ?? []).map(p => p.notes)].join('\n')
  if (REMOTE_RE.test(blob)) return 'remote'
  if (IN_COUNTRY_RE.test(blob)) return 'in_country'
  return 'unknown'
}

export function buildDecisionPack(program: Program): DecisionPack {
  const clock = program.complianceClock
  const renewal = clock?.renewal_interval_months
  const routes = (program.pathways ?? []).map(routeLine)
  const bankingScore = program.scorecard?.banking ?? null
  const bankingNote = bankingScore == null ? null : program.scorecard?.note?.trim() || null
  return {
    processingMonths: program.processingTimeMonths?.trim() || null,
    residencyDays: clock ? clock.residency_day_count_target : null,
    citizenshipYears: clock ? clock.citizenship_eligibility_years : null,
    renewalMonths: typeof renewal === 'number' ? renewal : null,
    routes,
    feeInBitcoin: feeStance(program.bitcoinSpecific),
    feeNote: program.bitcoinSpecific?.trim() ? firstSentence(program.bitcoinSpecific) : null,
    cryptoTaxNote: cryptoTaxNote(program.taxBenefits),
    filing: filingOf(program),
    mobilityNote: program.criticalTests?.notes?.trim() || null,
    mobilityScore: program.scorecard?.mobility ?? null,
    bankingNote,
    bankingScore,
    announced: routes.some(route => route.status === 'announced'),
  }
}

export interface ClockDisplay {
  process: string
  days: string
  years: string
  renewal: string
}

export function formatClocks(pack: DecisionPack, words: ClockWords = EN_CLOCK_WORDS): ClockDisplay {
  const process = pack.processingMonths ? `${pack.processingMonths} ${words.mo}` : words.missing
  const days =
    pack.residencyDays == null
      ? words.missing
      : pack.residencyDays === 0
        ? words.none
        : `${pack.residencyDays.toLocaleString('en-US')}${words.day}`
  const years =
    pack.citizenshipYears == null
      ? words.missing
      : pack.citizenshipYears === 0
        ? words.atGrant
        : `${pack.citizenshipYears}${words.year}`
  const renewal =
    pack.renewalMonths == null
      ? pack.citizenshipYears === 0
        ? words.none
        : words.missing
      : `${pack.renewalMonths} ${words.mo}`
  return { process, days, years, renewal }
}
