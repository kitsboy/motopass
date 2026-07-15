export type DistressedLane = 'curated' | 'permissionless' | 'all'

export type DistressedListing = {
  listing_id: string
  program_id: number
  program_name: string
  program_flag?: string
  region: string
  pathway_type: string
  pathway_label: string
  lane: 'curated' | 'permissionless'
  ask_usd: number
  proof_url: string
  ots_path?: string
  content_hash: string
  escrow_policy: 'template_only' | 'arbiter_active'
  distressed_score: number
  summary: string
  red_flags: string[]
  optimization_tips: string[]
  btcmap_country_slug: string
  status: 'active' | 'pending' | 'expired'
}

export type DistressedFilters = {
  region: string
  minScore: number
  maxBtcUsd: number
}