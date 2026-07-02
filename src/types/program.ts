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