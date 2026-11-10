import type { Program } from '../components/programs/types'

export interface FactEvidence {
  /** ISO date of the audit row that last wrote this fact. */
  date: string
  /** The URL that row names, when it names one. */
  source: string | null
}

/**
 * Which audit rows speak for which fact. Matching is by substring on the audit
 * `field`, because the corpus names fields by path (`scorecard.banking`,
 * `compliance_clock.residency_day_count_target`) rather than by fact key.
 * A fact with no matching row has no evidence date — it is not given one.
 */
const FIELD_HINTS: Record<string, string[]> = {
  processing_time: ['processing_time', 'processing'],
  gov_fees: ['gov_fees', 'gov fee'],
  tax_sentence: ['tax_benefits', 'tax_score', 'tax sentence'],
  crypto_tax_sentence: ['crypto_tax', 'crypto/bitcoin', 'tax_benefits'],
  fee_in_bitcoin: ['bitcoin_specific', 'fee_in_bitcoin'],
  days_in_country: ['residency_day_count', 'days_in_country', 'days', 'compliance_clock'],
  years_to_citizenship: ['citizenship_eligibility', 'years_to_citizenship', 'compliance_clock'],
  renewal_months: ['renewal_interval', 'renewal', 'compliance_clock'],
  mobility_text: ['critical_tests', 'mobility'],
  mobility_score: ['scorecard.mobility', 'mobility'],
  banking_score: ['scorecard.banking', 'banking'],
  tax_score: ['scorecard.tax'],
  pathways: ['pathways', 'pathway'],
  official_urls: ['official_urls'],
  watched_urls: ['watch'],
  sources_cited: ['sources', 'source'],
  pros: ['pros'],
  cons: ['cons'],
  red_flags: ['red_flags'],
  optimization_tips: ['optimization_tips'],
  common_questions: ['common_questions'],
  property_ownership: ['property_foreign_ownership', 'property'],
  recent_changes: ['recent_changes'],
}

/** First URL inside a source string — audit rows often say "Agency — https://…". */
function firstUrl(value: string | undefined): string | null {
  if (!value) return null
  const match = value.match(/https?:\/\/[^\s)]+/i)
  if (!match) return null
  return match[0].replace(/[.,;]+$/, '')
}

/** "Program settings" key → "program settings" label. No invented wording. */
export function factLabel(key: string): string {
  return key.replace(/_/g, ' ')
}

/** The last audit row that touched this fact, newest first. */
export function evidenceFor(program: Program, factKey: string): FactEvidence | null {
  const hints = FIELD_HINTS[factKey] ?? [factKey]
  const rows = program.auditTrail ?? []
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i]
    const field = (row.field ?? '').toLowerCase()
    if (!field) continue
    if (!hints.some(hint => field.includes(hint.toLowerCase()))) continue
    return {
      date: row.date,
      source: firstUrl(row.source),
    }
  }
  return null
}

/** Hostname for a link label, or null when the value isn't a URL. */
export function sourceHost(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}
