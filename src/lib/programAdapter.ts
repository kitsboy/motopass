import type { Program as DataProgram } from '../types/program'
import type { Program as CinematicProgram } from '../components/programs/types'
import { isAllowedSatohashUrl } from './timestampSecurity'
import { proofVerified, untracedCount } from './claims'
import { programCountryCode } from './countryCode'

const STUB_PROOF_RE = /aaaa|placeholder|stub|demo|0000000/i

export function isStubProofUrl(url: string | undefined): boolean {
  if (!url) return true
  return STUB_PROOF_RE.test(url)
}

/** URL on file is never Bitcoin-verified. */
export function proofStatusFromUrl(url: string | undefined): 'pending' | 'demo' | 'recorded' {
  if (!url) return 'pending'
  if (isStubProofUrl(url) || !isAllowedSatohashUrl(url)) return 'demo'
  return 'recorded'
}

/**
 * The badge a record actually earns. "verified" is reserved for a hash that
 * Satohash's API resolves — twenty pathway proofs on the site carried URLs for
 * stamps that do not exist, so a URL alone can no longer earn a badge.
 */
export function proofStatusForRecord(p: DataProgram): 'verified' | 'pending' | 'demo' | 'recorded' {
  const proof = p.satohash_proofs?.find(x => x.content_hash && proofVerified(p.name, x.content_hash))
  if (proof) return 'verified'
  return proofStatusFromUrl(p.satohash_proofs?.[0]?.proof_url)
}

/** User-added research placeholders — not valid registration targets. */
export function isResearchProgram(p: DataProgram): boolean {
  return p.status === 'Researching' || p.id > 100_000
}

export function parseMonthsToDays(raw: string | null | undefined): number {
  if (!raw) return 365
  const m = raw.match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!m) return 365
  const low = Number(m[1])
  const high = m[2] ? Number(m[2]) : low
  return Math.round(((low + high) / 2) * 30)
}

function mapTier(category: string): CinematicProgram['tier'] {
  const c = category.toLowerCase()
  if (c.includes('citizenship') || c.includes('cbi') || c.includes('passport')) return 'Citizenship'
  if (c.includes('golden') || c.includes('visa') || c.includes('rbi')) return 'Golden Visa'
  return 'Residency'
}

function proofRef(p: DataProgram): string | undefined {
  const url = p.satohash_proofs?.[0]?.proof_url
  if (!url) return undefined
  const tail = url.replace(/\/$/, '').slice(-8)
  return `${tail.slice(0, 4)}…${tail.slice(-4)}`
}

/** Map countries.json Program → Warm Sovereign Cinematic card/table shape */
export function toCinematicProgram(p: DataProgram): CinematicProgram {
  const sovereigntyScore = Math.round((p.sovereignty_score ?? 6) * 10)
  // Zero is not "free": it is "we do not have this figure". Callers must check
  // minOnFile before printing a dollar amount.
  const minOnFile = p.finance.min_investment_usd != null || p.finance.typical_investment_usd != null
  const minInvestment = p.finance.min_investment_usd ?? p.finance.typical_investment_usd ?? 0

  const proof = p.satohash_proofs?.[0]

  return {
    id: String(p.id),
    country: p.name,
    countryCode: programCountryCode(p.name),
    tier: mapTier(p.category),
    region: p.region,
    minInvestment,
    minOnFile,
    // The claim record behind the minimum, when the corpus has one. The card
    // uses it to link the page instead of calling a sourced figure unverified.
    claimSources: p.claim_sources ?? {},
    minClaim: p.claim_sources?.['finance.min_investment_usd'] ?? null,
    timelineDays: parseMonthsToDays(p.finance.processing_time_months),
    sovereigntyScore,
    proofStatus: proofStatusForRecord(p),
    unverifiedFigures: untracedCount(p),
    routeStatus: p.route_status,
    proofRef: proofRef(p),
    summary: p.details,
    flag: p.flag,
    category: p.category,
    status: p.status,
    lastChecked: p.last_checked,
    lastProbed: p.watch?.last_probe_at ?? null,
    proofStampedAt: proof?.stamped_at,
    bitcoinIntegration: p.bitcoin_integration,
    bitcoinSpecific: p.finance.bitcoin_specific,
    cryptoFriendlyScore: p.finance.crypto_friendly_score,
    typicalInvestment: p.finance.typical_investment_usd,
    govFees: p.finance.gov_fees_usd,
    processingTimeMonths: p.finance.processing_time_months,
    taxBenefits: p.finance.tax_benefits,
    stackingSynergy: p.stacking_synergy,
    riskLevel: p.risk_level,
    lightningReady: p.lightning_ready,
    sources: p.sources,
    proofUrl: proof?.proof_url,
    proofBlockHeight: proof?.block_height,
    flagshipDepth: p.flagship_depth,
    flagshipTier: p.flagship_tier ?? (p.flagship_depth ? 'deep' : undefined),
    policyMentionsBtc: !!p.policy_mentions_btc,
    highlightBtcFriendly: !!p.highlight_btc_friendly,
    pathways: p.pathways,
    criticalTests: p.critical_tests,
    legalCompliance: p.legal_compliance,
    complianceClock: p.compliance_clock,
    paigeFields: p.paige_fields,
    // Schema v3 intel (Country Intel pipeline). `proof.in_sync` is computed
    // server-side in intel.json (canonical-slice comparison) — surfaced via
    // the useIntel hook, never derived here.
    freshness: p.freshness,
    watchChanged: p.watch?.changed === true,
    watchUrls: p.watch?.urls,
    watchProbedAt: p.watch?.last_probe_at ?? null,
    pros: p.pros,
    cons: p.cons,
    scorecard: p.scorecard,
    auditTrail: p.audit_trail,
  }
}

export function cinematicIdToNumber(id: string): number {
  return Number(id)
}

export function toCinematicPrograms(programs: DataProgram[]): CinematicProgram[] {
  return programs.map(toCinematicProgram)
}