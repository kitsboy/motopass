import { beforeEach, describe, expect, it } from 'vitest'
import { clearNip05Pins, forgetNip05Pin, loadNip05Pins, recordNip05Pin } from './nip05Pin'

const A = 'a'.repeat(64)
const B = 'b'.repeat(64)

beforeEach(() => {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size
      },
    } as Storage,
  })
})

describe('NIP-05 continuity pins', () => {
  it('stores a new public mapping and recognises the same key', () => {
    const first = recordNip05Pin('Cam@Example.com', A, ['wss://relay.example'], 1000)
    expect(first?.status).toBe('new')
    expect(first?.pin.handle).toBe('cam@example.com')
    expect(loadNip05Pins()).toHaveLength(1)

    const second = recordNip05Pin('cam@example.com', A.toUpperCase(), [], 2000)
    expect(second?.status).toBe('same')
    expect(second?.pin.firstSeen).toBe(1000)
    expect(second?.pin.lastSeen).toBe(2000)
    expect(loadNip05Pins()[0].relays).toEqual([])
  })

  it('marks a changed key as rotated and keeps the previous key', () => {
    recordNip05Pin('cam@example.com', A, [], 1000)
    const rotated = recordNip05Pin('cam@example.com', B, ['wss://new.example'], 3000)
    expect(rotated?.status).toBe('rotated')
    expect(rotated?.previous?.pubkey).toBe(A)
    expect(rotated?.pin.pubkey).toBe(B)
    expect(rotated?.pin.previousPubkey).toBe(A)
    expect(rotated?.pin.rotatedAt).toBe(3000)
  })

  it('does not pin malformed handles or keys', () => {
    expect(recordNip05Pin('not-a-handle', A)).toBeNull()
    expect(recordNip05Pin('cam@example.com', 'nope')).toBeNull()
    expect(loadNip05Pins()).toEqual([])
  })

  it('tracks a second rotation and returns to the original key as another rotation', () => {
    recordNip05Pin('cam@example.com', A, [], 1000)
    recordNip05Pin('cam@example.com', B, [], 2000)
    const back = recordNip05Pin('cam@example.com', A, [], 3000)
    expect(back?.status).toBe('rotated')
    expect(back?.previous?.pubkey).toBe(B)
    expect(back?.pin.previousPubkey).toBe(B)
    expect(back?.pin.rotatedAt).toBe(3000)
  })

  it('does not throw when localStorage is blocked', () => {
    const original = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked')
      },
    })
    expect(recordNip05Pin('cam@example.com', A)).toBeTruthy()
    expect(loadNip05Pins()).toEqual([])
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original })
  })

  it('forgets one handle and clears all pins', () => {
    recordNip05Pin('cam@example.com', A)
    recordNip05Pin('other@example.com', B)
    expect(forgetNip05Pin('cam@example.com')).toHaveLength(1)
    clearNip05Pins()
    expect(loadNip05Pins()).toEqual([])
  })
})
