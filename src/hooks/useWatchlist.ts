import { useCallback, useEffect, useState } from 'react'
import { loadWatchlist, toggleWatchlist, WATCHLIST_KEY } from '../lib/watchlistStorage'

/** Reactive watch-list state (localStorage-backed, cross-tab synced). */
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<number[]>(() => loadWatchlist())

  const refresh = useCallback(() => setWatchlist(loadWatchlist()), [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === WATCHLIST_KEY || e.key === null) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  const toggle = useCallback((id: number) => {
    const next = toggleWatchlist(id)
    setWatchlist(next)
    return next
  }, [])

  const isWatched = useCallback((id: number) => watchlist.includes(id), [watchlist])

  return { watchlist, toggle, isWatched, refresh }
}
