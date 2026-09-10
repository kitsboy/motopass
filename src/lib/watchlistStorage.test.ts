import { beforeEach, describe, expect, it } from 'vitest'
import { isWatched, loadWatchlist, toggleWatchlist, WATCHLIST_KEY } from './watchlistStorage'

const storage: Record<string, string> = {}

beforeEach(() => {
  Object.keys(storage).forEach(k => delete storage[k])
  globalThis.localStorage = {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => { storage[k] = v },
    removeItem: (k: string) => { delete storage[k] },
    clear: () => Object.keys(storage).forEach(k => delete storage[k]),
    key: () => null,
    length: 0,
  }
})

describe('watchlistStorage', () => {
  it('starts empty', () => {
    expect(loadWatchlist()).toEqual([])
  })

  it('toggles ids on and off', () => {
    const afterAdd = toggleWatchlist(7)
    expect(afterAdd).toEqual([7])
    expect(isWatched(loadWatchlist(), 7)).toBe(true)

    const afterRemove = toggleWatchlist(7)
    expect(afterRemove).toEqual([])
    expect(isWatched(loadWatchlist(), 7)).toBe(false)
  })

  it('persists across loads', () => {
    toggleWatchlist(3)
    toggleWatchlist(9)
    expect(loadWatchlist()).toEqual([3, 9])
  })

  it('tolerates corrupt storage', () => {
    localStorage.setItem(WATCHLIST_KEY, 'not-json{')
    expect(loadWatchlist()).toEqual([])
  })
})
