export interface ProgramFinance {
  min_investment_usd: number | null
  typical_investment_usd: number | null
  gov_fees_usd: number | null
  processing_time_months: string | null
  tax_benefits: string
  crypto_friendly_score: number | null
  bitcoin_specific: string
}

export interface SatohashProof {
  field: string
  block_height?: number
  proof_url?: string
  content_hash?: string
  ots_path?: string
  stamped_at?: string
  /** Satohash API-issued stamp id (when anchored via POST /api/stamp). */
  stamp_id?: string
}

/** Schema v3 — freshness ledger, computed daily by the intel pipeline. */
export type FreshnessStatus = 'fresh' | 'watch' | 'stale'

export interface ProgramFreshness {
  /** fresh ≤ 14d · watch ≤ 45d · stale > 45d since last_checked */
  status: FreshnessStatus
  days_stale: number
  /** ISO date of the last pipeline freshness sweep (null until first sweep). */
  last_sweep?: string | null
}

export interface WatchUrl {
  url: string
  /** ISO date of the last source probe (null until first probe). */
  last_probed?: string | null
  /** Short hash of the fetched body's first bytes — change detector. */
  last_hash?: string | null
  status: 'unprobed' | 'ok' | 'changed' | 'unreachable'
}

export interface ProgramWatch {
  urls: WatchUrl[]
  /** True when any watched official URL changed since the last probe. */
  changed: boolean
  last_probe_at?: string | null
}

export interface IntelClaim {
  text: string
  source?: string
  source_url?: string
  verified_at?: string
}

export type ScorecardMetric =
  | 'crypto_friendly'
  | 'freedom'
  | 'stability'
  | 'tax'
  | 'cost'
  | 'mobility'
  | 'banking'

export interface ProgramScorecard {
  /** 0–10 where a value exists; null = honest “research pending”. */
  crypto_friendly: number | null
  freedom: number | null
  stability: number | null
  tax: number | null
  cost: number | null
  mobility: number | null
  banking: number | null
  /** Human-readable note on derivation, e.g. “derived from corpus (BUILD 72)”. */
  note?: string
}

export interface AuditEntry {
  date: string
  field: string
  from?: string
  to: string
  source?: string
  /** Canonical-slice hash at the time of the entry (proof anchor). */
  hash?: string
}

export interface ProgramIntel {
  freshness?: ProgramFreshness
  watch?: ProgramWatch
  pros?: IntelClaim[]
  cons?: IntelClaim[]
  scorecard?: ProgramScorecard
  audit_trail?: AuditEntry[]
}

export interface ProgramPathway {
  type: string
  label: string
  min_investment_usd: number
  notes: string
}

export interface CriticalTests {
  live_and_work: boolean | null
  scope_of_freedom: boolean | null
  dual_citizenship: boolean | null
  notes?: string
}

export interface LegalCompliance {
  primary_laws: string[]
  official_urls: string[]
  property_foreign_ownership: string
  recent_changes: string
}

export interface ComplianceClock {
  renewal_interval_months: number
  citizenship_eligibility_years: number | null
  residency_day_count_target: number
}

export interface PaigeFields {
  common_questions: string[]
  red_flags: string[]
  optimization_tips: string[]
  escalate_when: string
}

export interface Program {
  id: number
  name: string
  category: string
  region: string
  status: string
  bitcoin_integration: string
  finance: ProgramFinance
  details: string
  last_checked: string
  sources?: string[]
  flag?: string
  lightning_ready?: boolean
  sovereignty_score?: number
  stacking_synergy?: string
  risk_level?: string
  last_verified_block?: number
  satohash_proofs?: SatohashProof[]
  /** Flagship v2 depth — Uruguay template */
  flagship_depth?: boolean
  /** `template` = seeded scaffold; omit = researched deep flagship */
  flagship_tier?: 'template' | 'deep'
  pathways?: ProgramPathway[]
  critical_tests?: CriticalTests
  legal_compliance?: LegalCompliance
  compliance_clock?: ComplianceClock
  paige_fields?: PaigeFields
  /** Schema v3 — intel pipeline (pros/cons, scorecard, freshness, watchdog, audit). */
  freshness?: ProgramFreshness
  watch?: ProgramWatch
  pros?: IntelClaim[]
  cons?: IntelClaim[]
  scorecard?: ProgramScorecard
  audit_trail?: AuditEntry[]
}

export interface PassportApplication {
  id: string
  programName: string
  applicantName: string
  npub?: string
  status: 'interest' | 'documents' | 'submitted' | 'stamped'
  createdAt: string
  dataHash: string
  satohashUrl?: string
  notes?: string
}