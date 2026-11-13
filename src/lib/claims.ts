import type { Program, ClaimSource } from '../types/program'
import coverage from '../data/claimCoverage.json'
import proofStatus from '../data/proofStatus.json'
import quoteStatus from '../data/quoteStatus.json'

/**
 * One question, asked everywhere: has this figure been traced to the exact
 * words on an official page?
 *
 * A figure is traced only when the record carries a `claim_sources` entry with
 * a URL, the words, and the day we read them. Everything else is unverified,
 * and unverified figures may not enter an average, a ranking, or a card.
 *
 * The counts come from scripts/audit-claims.py, so the site and the audit
 * table can never disagree.
 */
export function isTraced(program: Program, path: string): boolean {
  const src = (program.claim_sources ?? {})[path] as ClaimSource | undefined
  if (!src?.url || !src?.quote || !src?.fetched) return false
  // A quote that only exists in our file is a claim, not evidence. Until CI has
  // read the words back off the live page, the figure is unchecked.
  const table = quoteStatus as Record<string, Record<string, boolean>>
  return table[program.name]?.[path] === true
}

/** Every money or time figure this program shows, with its trace state. */
export function moneyFigures(program: Program): { path: string; value: number; traced: boolean }[] {
  const out: { path: string; value: number; traced: boolean }[] = []
  const push = (path: string, value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return
    out.push({ path, value, traced: isTraced(program, path) })
  }
  push('finance.min_investment_usd', program.finance?.min_investment_usd)
  push('finance.typical_investment_usd', program.finance?.typical_investment_usd)
  push('finance.gov_fees_usd', program.finance?.gov_fees_usd)
  ;(program.pathways ?? []).forEach((w, i) => push(`pathways[${i}].min_investment_usd`, w.min_investment_usd))
  return out
}

export function untracedCount(program: Program): number {
  return moneyFigures(program).filter(f => !f.traced).length
}

export function claimCoverage() {
  return coverage as {
    records: number
    figures_shown: number
    figures_traced: number
    coverage_pct: number
  }
}

/** The sentence the site says about itself, computed rather than asserted. */
export function coverageSentence(): string {
  const c = claimCoverage()
  return `${c.figures_traced} of ${c.figures_shown} figures traced to an official page`
}

type ProofEntry = { hash: string | null; resolves: boolean; chain_block_height: number | null }
const proofIndex = proofStatus as { records: Record<string, { proofs: Record<string, ProofEntry> }> }

/**
 * A proof may only be called verified when Satohash's own API resolves its
 * hash. A URL on file is not evidence; half the corpus had URLs for proofs that
 * do not exist.
 */
export function proofVerified(country: string, hash: string | undefined): boolean {
  if (!hash) return false
  const proofs = proofIndex.records?.[country]?.proofs ?? {}
  return Object.values(proofs).some(p => p.hash === hash && p.resolves)
}

/** The chain's block height for a resolved proof, or null. */
export function proofBlockHeight(country: string, hash: string | undefined): number | null {
  if (!hash) return null
  const proofs = proofIndex.records?.[country]?.proofs ?? {}
  const hit = Object.values(proofs).find(p => p.hash === hash && p.resolves)
  return hit?.chain_block_height ?? null
}

/**
 * Traced figures for one record, from the same audit that produces the
 * site-wide count. One definition of "traced" for the hero, /proof and the
 * cards: a figure with an official source, an exact quote and a fetch date.
 */
export function figuresTracedFor(name: string | undefined): { traced: number; shown: number } | null {
  if (!name) return null
  const perRecord = (coverage as { per_record?: Record<string, { traced: number; shown: number }> }).per_record
  const row = perRecord?.[name]
  return row ? { traced: row.traced, shown: row.shown } : null
}
