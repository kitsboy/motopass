import type { Program } from '../../types/program'
import type { DistressedFilters, DistressedLane, DistressedListing, DistressedSort } from '../../types/distressedListing'

const GOLD_CURATED = new Set(['Uruguay', 'Bolivia', 'El Salvador', 'UAE', 'Portugal', 'Georgia'])

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function proofHash(program: Program): string {
  const proof = program.satohash_proofs?.[0]
  if (proof?.content_hash) return proof.content_hash
  const tail = proof?.proof_url?.replace(/\/$/, '').split('/').pop() ?? ''
  return tail
}

function distressedScore(program: Program, pathwayMin: number): number {
  const min = pathwayMin || (program.finance.min_investment_usd ?? program.finance.typical_investment_usd ?? 100_000)
  let score = Math.min(5, Math.max(1, Math.round((250_000 - min) / 50_000)))
  const text = [
    ...(program.paige_fields?.red_flags ?? []),
    ...(program.paige_fields?.optimization_tips ?? []),
    program.details,
  ].join(' ').toLowerCase()
  if (/budget|value|solvency|low.?capital|distressed|qrp/.test(text)) score = Math.min(5, score + 1)
  if ((program.sovereignty_score ?? 6) <= 6) score = Math.min(5, score + 1)
  if (program.flagship_tier === 'deep') score = Math.min(5, score + 1)
  if (GOLD_CURATED.has(program.name)) score = Math.min(5, score + 1)
  return score
}

function isCuratedCandidate(program: Program, score: number): boolean {
  return score >= 4 && Boolean(program.satohash_proofs?.[0]?.proof_url)
}

export function buildDistressedListings(programs: Program[]): DistressedListing[] {
  const candidates = programs.filter(
    p => p.flagship_depth && p.satohash_proofs?.[0]?.proof_url && p.pathways?.length,
  )

  const rows: {
    program: Program
    score: number
    pathway: NonNullable<Program['pathways']>[number]
    askUsd: number
    proof: NonNullable<Program['satohash_proofs']>[number]
    hash: string
  }[] = []

  for (const program of candidates) {
    const proof = program.satohash_proofs![0]
    const hash = proofHash(program)
    for (const pathway of program.pathways!) {
      const askUsd = pathway.min_investment_usd || program.finance.typical_investment_usd || 50_000
      rows.push({
        program,
        score: distressedScore(program, pathway.min_investment_usd),
        pathway,
        askUsd,
        proof,
        hash,
      })
    }
  }

  const ranked = [...rows].sort((a, b) => b.score - a.score || a.askUsd - b.askUsd)
  const curatedKeys = new Set(
    ranked
      .filter(r => isCuratedCandidate(r.program, r.score))
      .slice(0, 18)
      .map(r => `${r.program.id}-${r.pathway.type}`),
  )

  return rows.map(({ program, score, pathway, askUsd, proof, hash }) => {
    const key = `${program.id}-${pathway.type}`
    const curated = curatedKeys.has(key)
    const gold = curated && (GOLD_CURATED.has(program.name) || program.flagship_tier === 'deep')

    return {
      listing_id: `${slugify(program.name)}-${pathway.type}`,
      program_id: program.id,
      program_name: program.name,
      program_flag: program.flag,
      region: program.region,
      pathway_type: pathway.type,
      pathway_label: pathway.label,
      lane: curated ? ('curated' as const) : ('permissionless' as const),
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
      curated_tier: curated ? (gold ? 'gold' : 'standard') : undefined,
      block_height: proof.block_height,
      sovereignty_score: program.sovereignty_score,
      stacking_synergy: program.stacking_synergy,
    }
  })
}

export function filterListings(
  listings: DistressedListing[],
  lane: DistressedLane,
  filters: DistressedFilters,
  bookmarkIds?: string[],
): DistressedListing[] {
  return listings.filter(l => {
    if (lane !== 'all' && l.lane !== lane) return false
    if (filters.region !== 'all' && l.region !== filters.region) return false
    if (l.distressed_score < filters.minScore) return false
    if (filters.maxBtcUsd > 0 && l.ask_usd > filters.maxBtcUsd) return false
    if (filters.proofGatedOnly && l.lane !== 'permissionless') return false
    if (filters.bookmarksOnly && bookmarkIds && !bookmarkIds.includes(l.listing_id)) return false
    return true
  })
}

export function distressedRegions(listings: DistressedListing[]): string[] {
  return [...new Set(listings.map(l => l.region))].sort()
}

export function sortListings(listings: DistressedListing[], sort: DistressedSort): DistressedListing[] {
  const copy = [...listings]
  if (sort === 'discount') {
    return copy.sort(
      (a, b) =>
        (b.curated_tier === 'gold' ? 1 : 0) - (a.curated_tier === 'gold' ? 1 : 0) ||
        b.distressed_score - a.distressed_score ||
        a.ask_usd - b.ask_usd,
    )
  }
  if (sort === 'price') {
    return copy.sort((a, b) => a.ask_usd - b.ask_usd)
  }
  return copy.sort((a, b) => a.region.localeCompare(b.region) || a.program_name.localeCompare(b.program_name))
}