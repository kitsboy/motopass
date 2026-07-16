import { describe, it, expect, beforeEach } from 'vitest'
import {
  PAIGE_HISTORY_KEY,
  PAIGE_HISTORY_MAX,
  clearPaigeHistory,
  loadPaigeHistory,
  savePaigeHistory,
  trimPaigeHistory,
} from './paigeHistory'

beforeEach(() => {
  const store: Record<string, string> = {}
  globalThis.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    key: () => null,
    length: 0,
  }
})

describe('paigeHistory', () => {
  it('trims to last 10 messages', () => {
    const msgs = Array.from({ length: 12 }, (_, i) => ({ role: 'user' as const, text: `m${i}` }))
    expect(trimPaigeHistory(msgs)).toHaveLength(PAIGE_HISTORY_MAX)
    expect(trimPaigeHistory(msgs)[0].text).toBe('m2')
  })

  it('persists and loads valid history', () => {
    savePaigeHistory([
      { role: 'user', text: 'Uruguay tax' },
      { role: 'paige', kind: 'hits', programIds: [3, 7] },
    ])
    expect(loadPaigeHistory()).toEqual([
      { role: 'user', text: 'Uruguay tax' },
      { role: 'paige', kind: 'hits', programIds: [3, 7] },
    ])
    expect(localStorage.getItem(PAIGE_HISTORY_KEY)).toBeTruthy()
  })

  it('clears history', () => {
    savePaigeHistory([{ role: 'user', text: 'test' }])
    clearPaigeHistory()
    expect(loadPaigeHistory()).toEqual([])
  })
})