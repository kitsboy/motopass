import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadDistressedState,
  saveDistressedState,
  countDistressedActiveFilters,
  DISTRESSED_FILTERS_KEY,
} from './distressedStorage'

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

describe('distressedStorage', () => {
  it('round-trips lane, sort, and filters', () => {
    const state = {
      lane: 'curated' as const,
      sort: 'price' as const,
      filters: { region: 'Europe', minScore: 3, maxBtcUsd: 100_000 },
    }
    saveDistressedState(state)
    expect(storage[DISTRESSED_FILTERS_KEY]).toBeTruthy()
    expect(loadDistressedState()).toEqual(state)
  })

  it('rejects invalid stored payload', () => {
    storage[DISTRESSED_FILTERS_KEY] = JSON.stringify({ lane: 'bogus', sort: 'discount', filters: {} })
    expect(loadDistressedState()).toBeNull()
  })

  it('counts active filters', () => {
    expect(countDistressedActiveFilters({ region: 'all', minScore: 1, maxBtcUsd: 0 }, 'all')).toBe(0)
    expect(countDistressedActiveFilters({ region: 'Asia', minScore: 4, maxBtcUsd: 50_000 }, 'curated')).toBe(4)
  })
})