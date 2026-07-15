import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadHashHistory,
  pushHashHistory,
  clearHashHistory,
} from './verifyHashHistory'

const HASH_A = 'a'.repeat(64)
const HASH_B = 'b'.repeat(64)
const HASH_C = 'c'.repeat(64)

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
  clearHashHistory()
})

describe('verifyHashHistory', () => {

  it('returns empty history when unset', () => {
    expect(loadHashHistory()).toEqual([])
  })

  it('stores and dedupes hashes with newest first', () => {
    pushHashHistory(HASH_A, 'first')
    pushHashHistory(HASH_B)
    pushHashHistory(HASH_A, 'again')

    expect(loadHashHistory()).toEqual([
      { hash: HASH_A, label: 'again', ts: expect.any(String) },
      { hash: HASH_B, label: undefined, ts: expect.any(String) },
    ])
  })

  it('keeps only the last five entries', () => {
    const hashes = [HASH_A, HASH_B, HASH_C, 'd'.repeat(64), 'e'.repeat(64), 'f'.repeat(64)]
    hashes.forEach(h => pushHashHistory(h))
    expect(loadHashHistory()).toHaveLength(5)
    expect(loadHashHistory()[0].hash).toBe('f'.repeat(64))
  })

  it('ignores invalid hashes', () => {
    pushHashHistory('not-a-hash')
    expect(loadHashHistory()).toEqual([])
  })
})