import type { Program as DataProgram } from '../types/program'
import type { Program as CinematicProgram } from '../components/programs/types'
import { isAllowedSatohashUrl } from './timestampSecurity'

const ISO_BY_NAME: Record<string, string> = {
  'El Salvador': 'SV',
  Malta: 'MT',
  Portugal: 'PT',
  'St Kitts & Nevis': 'KN',
  Paraguay: 'PY',
  Uruguay: 'UY',
  Switzerland: 'CH',
  Singapore: 'SG',
  'United Arab Emirates': 'AE',
  Bolivia: 'BO',
  'UAE (Dubai / Abu Dhabi)': 'AE',
  Panama: 'PA',
  Georgia: 'GE',
  Montenegro: 'ME',
  Turkey: 'TR',
  Thailand: 'TH',
  Mexico: 'MX',
  Brazil: 'BR',
  Argentina: 'AR',
  Chile: 'CL',
  Colombia: 'CO',
  'Costa Rica': 'CR',
  Dominica: 'DM',
  Grenada: 'GD',
  'Antigua and Barbuda': 'AG',
  'St Lucia': 'LC',
  Vanuatu: 'VU',
  Cambodia: 'KH',
  Malaysia: 'MY',
  Indonesia: 'ID',
  Philippines: 'PH',
  Japan: 'JP',
  'South Korea': 'KR',
  Taiwan: 'TW',
  'Hong Kong': 'HK',
  Mauritius: 'MU',
  Seychelles: 'SC',
  Cyprus: 'CY',
  Greece: 'GR',
  Spain: 'ES',
  Italy: 'IT',
  France: 'FR',
  Germany: 'DE',
  Austria: 'AT',
  Ireland: 'IE',
  'United Kingdom': 'GB',
  Canada: 'CA',
  'United States': 'US',
  Australia: 'AU',
  'New Zealand': 'NZ',
  // Correct ISO 3166-1 alpha-2 for remaining programs (initials fallback
  // produces wrong flags: CAR→CA(Canada), St. Kitts→SK(Slovakia), etc.)
  'Central African Republic': 'CF',
  'St. Kitts and Nevis': 'KN',
  'St. Lucia': 'LC',
  Barbados: 'BB',
  Bahamas: 'BS',
  Belize: 'BZ',
  Latvia: 'LV',
  Estonia: 'EE',
  Bulgaria: 'BG',
  Croatia: 'HR',
  'Cayman Islands': 'KY',
  Andorra: 'AD',
}

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

function countryCode(name: string): string {
  if (ISO_BY_NAME[name]) return ISO_BY_NAME[name]
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
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
  const minInvestment = p.finance.min_investment_usd ?? p.finance.typical_investment_usd ?? 0

  const proof = p.satohash_proofs?.[0]

  return {
    id: String(p.id),
    country: p.name,
    countryCode: countryCode(p.name),
    tier: mapTier(p.category),
    region: p.region,
    minInvestment,
    timelineDays: parseMonthsToDays(p.finance.processing_time_months),
    sovereigntyScore,
    proofStatus: proofStatusFromUrl(proof?.proof_url),
    proofRef: proofRef(p),
    summary: p.details,
    flag: p.flag,
    category: p.category,
    status: p.status,
    lastChecked: p.last_checked,
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