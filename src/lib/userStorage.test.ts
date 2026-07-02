import { describe, it, expect, beforeEach } from 'vitest'
import { loadProfile, saveProfile, clearProfile } from './userStorage'

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

describe('userStorage', () => {
  it('persists and loads profile', () => {
    const profile = {
      npub: 'npub1test',
      pubkey: 'pk',
      program: 'Uruguay RBI',
      country: 'Uruguay',
      agentId: 'kimi',
      agentName: 'Kimi',
      status: 'registered' as const,
      registeredAt: '2026-07-02',
      documents: [],
      payments: [],
    }
    saveProfile(profile)
    expect(loadProfile()?.npub).toBe('npub1test')
    clearProfile()
    expect(loadProfile()).toBeNull()
  })
})