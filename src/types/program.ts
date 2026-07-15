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
}

export interface ProgramPathway {
  type: string
  label: string
  min_investment_usd: number
  notes: string
}

export interface CriticalTests {
  live_and_work: boolean
  scope_of_freedom: boolean
  dual_citizenship: boolean
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
  pathways?: ProgramPathway[]
  critical_tests?: CriticalTests
  legal_compliance?: LegalCompliance
  compliance_clock?: ComplianceClock
  paige_fields?: PaigeFields
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