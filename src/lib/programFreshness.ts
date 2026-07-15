/** Resolve the best available freshness date for a program (proof stamp preferred). */
export function resolveFreshnessDate(
  lastChecked?: string,
  proofStampedAt?: string,
): string | null {
  const proof = proofStampedAt?.slice(0, 10)
  if (proof) return proof
  const checked = lastChecked?.slice(0, 10)
  return checked || null
}

export type FreshnessLevel = 'fresh' | 'recent' | 'stale'

/** Days since date; negative if date is in the future. */
export function daysSince(isoDate: string, now = new Date()): number {
  const then = new Date(`${isoDate}T12:00:00Z`)
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12))
  return Math.floor((today.getTime() - then.getTime()) / 86_400_000)
}

export function freshnessLevel(isoDate: string, now = new Date()): FreshnessLevel {
  const days = daysSince(isoDate, now)
  if (days <= 30) return 'fresh'
  if (days <= 90) return 'recent'
  return 'stale'
}

/** Short label for badge, e.g. "Jul 2026" */
export function formatFreshnessLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}