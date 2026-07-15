import { describe, it, expect } from 'vitest'
import { similarDistressedListings } from './distressedSimilar'
import type { DistressedListing } from '../types/distressedListing'

function listing(id: string, region: string, score: number, ask: number): DistressedListing {
  return {
    listing_id: id,
    program_id: Number(id),
    program_name: `Program ${id}`,
    region,
    pathway_type: 'rbi',
    pathway_label: 'RBI',
    lane: 'curated',
    ask_usd: ask,
    proof_url: 'https://satohash.io/verify/abc',
    content_hash: 'a'.repeat(64),
    escrow_policy: 'template_only',
    distressed_score: score,
    summary: 'test',
    red_flags: [],
    optimization_tips: [],
    btcmap_country_slug: 'test',
    status: 'active',
  }
}

describe('similarDistressedListings', () => {
  it('prefers same-region peers', () => {
    const target = listing('1', 'Europe', 4, 100_000)
    const all = [
      target,
      listing('2', 'Europe', 4, 110_000),
      listing('3', 'Asia', 4, 105_000),
    ]
    const similar = similarDistressedListings(target, all)
    expect(similar[0]?.listing_id).toBe('2')
    expect(similar.map(s => s.region)).toContain('Europe')
  })

  it('excludes self and returns empty when no peers', () => {
    const target = listing('1', 'Europe', 4, 100_000)
    expect(similarDistressedListings(target, [target])).toEqual([])
  })
})