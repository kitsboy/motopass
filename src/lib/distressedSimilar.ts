import type { DistressedListing } from '../types/distressedListing'

/** Up to 3 peer listings: same region first, then similar score / ask band. */
export function similarDistressedListings(
  listing: DistressedListing,
  all: DistressedListing[],
  limit = 3,
): DistressedListing[] {
  const peers = all.filter(l => l.listing_id !== listing.listing_id)
  if (!peers.length) return []

  const scored = peers.map(l => {
    let score = 0
    if (l.region === listing.region) score += 4
    if (l.lane === listing.lane) score += 1
    if (Math.abs(l.distressed_score - listing.distressed_score) <= 1) score += 2
    const askRatio = Math.abs(l.ask_usd - listing.ask_usd) / Math.max(listing.ask_usd, 1)
    if (askRatio <= 0.25) score += 2
    else if (askRatio <= 0.5) score += 1
    return { listing: l, score }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.listing.ask_usd - b.listing.ask_usd)
    .slice(0, limit)
    .map(s => s.listing)
}