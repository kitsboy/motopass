/**
 * Watch-list storage — programs the user follows for change alerts.
 * Mirrors portfolioStorage conventions (localStorage, id list, cross-tab sync).
 * Watching is intentionally independent of owning (portfolio): you can watch a
 * jurisdiction you don't hold and get intel changes for it in the AlertInbox.
 */

export const WATCHLIST_KEY = 'motopass-watchlist'

export function loadWatchlist(): number[] {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveWatchlist(ids: number[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids))
}

export function toggleWatchlist(id: number): number[] {
  const current = loadWatchlist()
  const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
  saveWatchlist(next)
  return next
}

export function isWatched(ids: number[], id: number): boolean {
  return ids.includes(id)
}
