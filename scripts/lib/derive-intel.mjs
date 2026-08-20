/**
 * Pure intel derivation helpers (shared by migrate + freshness + tests).
 *
 * Everything here derives ONLY from vetted corpus fields and marks derived
 * claims with `source` + `verified_at` — never invents facts.
 */

export const FRESH_MAX_DAYS = 14
export const WATCH_MAX_DAYS = 45
export const CORPUS_SOURCE = 'MotoPass corpus (BUILD 72 research)'

const clamp = (n, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, n))
const truncate = (s, max) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s)

export function daysSince(iso, now = Date.now()) {
  if (!iso) return null
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 864e5))
}

export function freshnessStatus(days) {
  if (days == null) return 'stale'
  if (days <= FRESH_MAX_DAYS) return 'fresh'
  if (days <= WATCH_MAX_DAYS) return 'watch'
  return 'stale'
}

function firstSentence(text, max = 140) {
  if (!text) return null
  const clean = text.trim().replace(/\s+/g, ' ')
  const cut = clean.split(/(?<=[.!?])\s/)[0] ?? clean
  return truncate(cut, max)
}

export function derivePros(p) {
  const pros = []
  const push = (text) => {
    if (text && !pros.some(x => x.text === text)) pros.push(text)
  }
  if (p.critical_tests?.live_and_work === true) push('Right to live and work for approved residents')
  if (p.critical_tests?.dual_citizenship === true) push('Dual citizenship permitted')
  if (p.critical_tests?.scope_of_freedom === true) push('Broad scope of freedom for residents')
  const btc = firstSentence(p.finance?.bitcoin_specific, 120)
  if (btc) push(`Bitcoin: ${btc}`)
  for (const tip of p.paige_fields?.optimization_tips ?? []) {
    push(`Tip: ${truncate(tip.trim(), 110)}`)
    if (pros.length >= 5) break
  }
  return pros.slice(0, 5).map(text => ({ text, source: CORPUS_SOURCE, verified_at: p.last_checked }))
}

export function deriveCons(p) {
  const cons = []
  const push = (text) => {
    if (text && !cons.some(x => x.text === text)) cons.push(text)
  }
  if (p.critical_tests?.scope_of_freedom === false) push('Limited scope of freedom')
  if (p.critical_tests?.dual_citizenship === false) push('Dual citizenship not available')
  if (p.risk_level === 'medium') push('Elevated operational risk (medium) — verify security and legal exposure before committing')
  if (p.risk_level === 'high') push('High risk profile — not recommended as a primary hub without deep diligence')
  for (const flag of p.paige_fields?.red_flags ?? []) {
    push(truncate(flag.trim(), 130))
    if (cons.length >= 5) break
  }
  return cons.slice(0, 5).map(text => ({ text, source: CORPUS_SOURCE, verified_at: p.last_checked }))
}

const TAX_PRO = /no (personal )?income|0%|zero|no capital gains|no inheritance/i
const TAX_TERRITORIAL = /territorial/i
const TAX_FAVORABLE = /favorable|favourable|attractive|incentive/i

export function deriveScorecard(p) {
  const finance = p.finance ?? {}
  let tax = null
  const taxText = finance.tax_benefits ?? ''
  if (TAX_PRO.test(taxText)) tax = 9
  else if (TAX_TERRITORIAL.test(taxText)) tax = 8
  else if (TAX_FAVORABLE.test(taxText)) tax = 7
  const stability =
    p.risk_level === 'low' ? 9 : p.risk_level === 'medium' ? 6 : p.risk_level === 'high' ? 3 : null
  const min = finance.min_investment_usd ?? finance.typical_investment_usd ?? null
  let cost = null
  if (min === 0) {
    cost = 10
  } else if (min != null && min > 0) {
    // Cheaper entry → higher cost score. Log-scale so $0–$5M maps ~10→1.
    cost = clamp(Math.round(10 - 3.2 * Math.log10(min + 1)), 1, 10)
  }
  return {
    crypto_friendly: finance.crypto_friendly_score ?? null,
    freedom: p.sovereignty_score ?? null,
    stability,
    tax,
    cost,
    mobility: null,
    banking: null,
    note: 'Derived from vetted corpus fields (BUILD 72) — tax/stability keyword heuristics; mobility & banking pending research.',
  }
}
