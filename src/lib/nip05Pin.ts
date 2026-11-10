import { parseNip05 } from './nip05'

/**
 * NIP-05 continuity pinning.
 *
 * A NIP-05 name is domain trust: the domain owner can repoint it. This store
 * keeps the first key seen for a handle in localStorage and reports a change
 * instead of silently accepting it. It stores public identifiers only.
 */

const PIN_KEY = 'motopass-nip05-pins'
const MAX_PINS = 50

export interface Nip05Pin {
  handle: string
  pubkey: string
  relays: string[]
  firstSeen: number
  lastSeen: number
  previousPubkey: string | null
  rotatedAt: number | null
}

export type Nip05PinStatus = 'new' | 'same' | 'rotated'

export interface Nip05PinRecord {
  status: Nip05PinStatus
  pin: Nip05Pin
  previous: Nip05Pin | null
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function loadNip05Pins(): Nip05Pin[] {
  const store = storage()
  if (!store) return []
  try {
    const parsed: unknown = JSON.parse(store.getItem(PIN_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((pin): pin is Nip05Pin => {
      if (!pin || typeof pin !== 'object') return false
      const value = pin as Partial<Nip05Pin>
      return (
        typeof value.handle === 'string' &&
        typeof value.pubkey === 'string' &&
        Array.isArray(value.relays) &&
        typeof value.firstSeen === 'number' &&
        typeof value.lastSeen === 'number'
      )
    })
  } catch {
    return []
  }
}

function savePins(pins: Nip05Pin[]): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(PIN_KEY, JSON.stringify(pins.slice(0, MAX_PINS)))
  } catch {
    // A full or blocked storage area must not break identity resolution.
  }
}

/** Record a resolved name and say whether its key is new, unchanged or rotated. */
export function recordNip05Pin(
  handleInput: string,
  pubkey: string,
  relays: string[] = [],
  now = Date.now(),
): Nip05PinRecord | null {
  const identifier = parseNip05(handleInput)
  if (!identifier || !/^[0-9a-f]{64}$/i.test(pubkey)) return null
  const handle = `${identifier.name.toLowerCase()}@${identifier.domain}`
  const normalized = pubkey.toLowerCase()
  const pins = loadNip05Pins()
  const existing = pins.find(pin => pin.handle === handle) ?? null

  if (!existing) {
    const pin: Nip05Pin = {
      handle,
      pubkey: normalized,
      relays,
      firstSeen: now,
      lastSeen: now,
      previousPubkey: null,
      rotatedAt: null,
    }
    savePins([pin, ...pins])
    return { status: 'new', pin, previous: null }
  }

  if (existing.pubkey === normalized) {
    const pin: Nip05Pin = { ...existing, relays, lastSeen: now }
    savePins([pin, ...pins.filter(item => item.handle !== handle)])
    return { status: 'same', pin, previous: existing }
  }

  const pin: Nip05Pin = {
    ...existing,
    pubkey: normalized,
    relays,
    firstSeen: now,
    lastSeen: now,
    previousPubkey: existing.pubkey,
    rotatedAt: now,
  }
  savePins([pin, ...pins.filter(item => item.handle !== handle)])
  return { status: 'rotated', pin, previous: existing }
}

export function forgetNip05Pin(handleInput: string): Nip05Pin[] {
  const identifier = parseNip05(handleInput)
  if (!identifier) return loadNip05Pins()
  const handle = `${identifier.name.toLowerCase()}@${identifier.domain}`
  const remaining = loadNip05Pins().filter(pin => pin.handle !== handle)
  savePins(remaining)
  return remaining
}

export function clearNip05Pins(): void {
  const store = storage()
  if (store) store.removeItem(PIN_KEY)
}
