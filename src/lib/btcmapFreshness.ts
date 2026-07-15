import { daysSince, freshnessLevel, type FreshnessLevel } from './programFreshness'

/** Format ISO timestamp from btcmap cache snapshot for badge label (item 622). */
export function formatCacheAge(fetchedAt: string, now = new Date()): string {
  const d = new Date(fetchedAt)
  if (Number.isNaN(d.getTime())) return 'unknown'

  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function cacheFreshnessLevel(fetchedAt: string, now = new Date()): FreshnessLevel {
  const iso = fetchedAt.slice(0, 10)
  return freshnessLevel(iso, now)
}

export function cacheFreshnessDays(fetchedAt: string, now = new Date()): number {
  return daysSince(fetchedAt.slice(0, 10), now)
}