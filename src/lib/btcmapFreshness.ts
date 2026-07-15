import { daysSince } from './programFreshness'

export type CacheFreshnessLevel = 'fresh' | 'recent' | 'expired'

const CACHE_STALE_DAYS = 14

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

/** Badge level: red when offline cache is older than 14 days (item 727). */
export function cacheFreshnessLevel(fetchedAt: string, now = new Date()): CacheFreshnessLevel {
  const days = cacheFreshnessDays(fetchedAt, now)
  if (days <= 7) return 'fresh'
  if (days <= CACHE_STALE_DAYS) return 'recent'
  return 'expired'
}

export function isCacheExpired(fetchedAt: string, now = new Date()): boolean {
  return cacheFreshnessLevel(fetchedAt, now) === 'expired'
}

export function cacheFreshnessDays(fetchedAt: string, now = new Date()): number {
  return daysSince(fetchedAt.slice(0, 10), now)
}