import type { Program } from '../../types/program'
import type { DistressedFilters, DistressedLane, DistressedListing, DistressedSort } from '../../types/distressedListing'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function proofHash(program: Program): string {
  const proof = program.satohash_proofs?.[0]
  if (proof?.content_hash) return proof.content_hash
  const tail = proof?.proof_url?.replace(/\/$/, '').split('/').pop() ?? ''
  return tail
}

function distressedScore(program: Program): number {
  const min = program.finance.min_investment_usd ?? program.finance.typical_investment_usd ?? 100_000
  let score = Math.min(5, Math.max(1, Math.round((250_000 - min) / 50_000)))
  const text = [
    ...(program.paige_fields?.red_flags ?? []),
    ...(program.paige_fields?.optimization_tips ?? []),
    program.details,
  ].join(' ').toLowerCase()
  if (/budget|value|solvency|low.?capital|distressed|qrp/.test(text)) score = Math.min(5, score + 1)
  if ((program.sovereignty_score ?? 6) <= 6) score = Math.min(5, score + 1)
  return score
}

export function buildDistressedListings(programs: Program[]): DistressedListing[] {
  const candidates = programs.filter(
    p => p.flagship_depth && p.satohash_proofs?.[0]?.proof_url && p.pathways?.length,
  )

  const scored = candidates.map(program => {
    const score = distressedScore(program)
    const pathway = program.pathways![0]
    const askUsd = pathway.min_investment_usd || program.finance.typical_investment_usd || 50_000
    const proof = program.satohash_proofs![0]
    const hash = proofHash(program)
    return { program, score, pathway, askUsd, proof, hash }
  })

  const curatedIds = new Set(
    [...scored].sort((a, b) => b.score - a.score).slice(0, 12).map(s => s.program.id),
  )

  return scored.map(({ program, score, pathway, askUsd, proof, hash }) => ({
    listing_id: `${slugify(program.name)}-${pathway.type}`,
    program_id: program.id,
    program_name: program.name,
    program_flag: program.flag,
    region: program.region,
    pathway_type: pathway.type,
    pathway_label: pathway.label,
    lane: curatedIds.has(program.id) ? 'curated' as const : 'permissionless' as const,
    ask_usd: askUsd,
    proof_url: proof.proof_url!,
    ots_path: proof.ots_path,
    content_hash: hash,
    escrow_policy: 'template_only' as const,
    distressed_score: score,
    summary: pathway.notes || program.details,
    red_flags: program.paige_fields?.red_flags ?? [],
    optimization_tips: program.paige_fields?.optimization_tips ?? [],
    btcmap_country_slug: slugify(program.name),
    status: 'active' as const,
  }))
}

export function filterListings(
  listings: DistressedListing[],
  lane: DistressedLane,
  filters: DistressedFilters,
): DistressedListing[] {
  return listings.filter(l => {
    if (lane !== 'all' && l.lane !== lane) return false
    if (filters.region !== 'all' && l.region !== filters.region) return false
    if (l.distressed_score < filters.minScore) return false
    if (filters.maxBtcUsd > 0 && l.ask_usd > filters.maxBtcUsd) return false
    return true
  })
}

export function distressedRegions(listings: DistressedListing[]): string[] {
  return [...new Set(listings.map(l => l.region))].sort()
}

export function sortListings(listings: DistressedListing[], sort: DistressedSort): DistressedListing[] {
  const copy = [...listings]
  if (sort === 'discount') {
    return copy.sort((a, b) => b.distressed_score - a.distressed_score || a.ask_usd - b.ask_usd)
  }
  if (sort === 'price') {
    return copy.sort((a, b) => a.ask_usd - b.ask_usd)
  }
  return copy.sort((a, b) => a.region.localeCompare(b.region) || a.program_name.localeCompare(b.program_name))
}