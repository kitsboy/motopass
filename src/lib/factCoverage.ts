import type { Program } from '../components/programs/types'
import { feeStance } from './decisionPack'

export interface FactCheck {
  key: string
  have: boolean
}

/**
 * The 23 facts the coverage audit counts, derived from the display program.
 * Nothing here is inferred from prose: a fact is "on file" only when its own
 * field carries a value. Renewal counts as satisfied when citizenship is granted
 * outright, because there is no permit to renew (the clocks already say "None").
 */
export function programFacts(program: Program): FactCheck[] {
  const clock = program.complianceClock
  const tax = program.taxBenefits ?? ''
  const count = (value: unknown[] | undefined) => (value?.length ?? 0) > 0
  return [
    { key: 'processing_time', have: Boolean(program.processingTimeMonths?.trim()) },
    { key: 'gov_fees', have: typeof program.govFees === 'number' },
    { key: 'tax_sentence', have: tax.trim().length > 0 },
    { key: 'crypto_tax_sentence', have: /Crypto\/Bitcoin tax:/i.test(tax) },
    { key: 'fee_in_bitcoin', have: feeStance(program.bitcoinSpecific) !== 'unknown' },
    { key: 'days_in_country', have: clock?.residency_day_count_target != null },
    { key: 'years_to_citizenship', have: clock?.citizenship_eligibility_years != null },
    {
      key: 'renewal_months',
      have: clock?.renewal_interval_months != null || clock?.citizenship_eligibility_years === 0,
    },
    { key: 'mobility_text', have: Boolean(program.criticalTests?.notes?.trim()) },
    { key: 'mobility_score', have: program.scorecard?.mobility != null },
    { key: 'banking_score', have: program.scorecard?.banking != null },
    { key: 'tax_score', have: program.scorecard?.tax != null },
    { key: 'pathways', have: count(program.pathways) },
    { key: 'official_urls', have: count(program.legalCompliance?.official_urls) },
    { key: 'watched_urls', have: count(program.watchUrls) },
    { key: 'sources_cited', have: count(program.sources) },
    { key: 'pros', have: count(program.pros) },
    { key: 'cons', have: count(program.cons) },
    { key: 'red_flags', have: count(program.paigeFields?.red_flags) },
    { key: 'optimization_tips', have: count(program.paigeFields?.optimization_tips) },
    { key: 'common_questions', have: count(program.paigeFields?.common_questions) },
    { key: 'property_ownership', have: Boolean(program.legalCompliance?.property_foreign_ownership?.trim()) },
    { key: 'recent_changes', have: Boolean(program.legalCompliance?.recent_changes?.trim()) },
  ]
}

export function factTotals(program: Program): { have: number; total: number; missing: string[] } {
  const facts = programFacts(program)
  return {
    have: facts.filter(fact => fact.have).length,
    total: facts.length,
    missing: facts.filter(fact => !fact.have).map(fact => fact.key),
  }
}
