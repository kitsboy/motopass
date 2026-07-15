/**
 * Saved merchants local persistence + Nostr sync stub (item 624).
 *
 * Future: publish a replaceable Nostr kind event (e.g. kind 30078) with tags
 *   ['merchant', '<btcmap-place-id>'] per saved venue, keyed by npub.
 * Relay fan-out would replace this localStorage bridge for cross-device sync.
 */

const LOCAL_KEY = 'motopass-btcmap-saved'

function storage(): Storage | null {
  return typeof localStorage !== 'undefined' ? localStorage : null
}

export function loadLocalSavedIds(): number[] {
  try {
    const raw = storage()?.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
  } catch {
    return []
  }
}

export function persistLocalSavedIds(ids: number[]): void {
  storage()?.setItem(LOCAL_KEY, JSON.stringify([...new Set(ids)]))
}

export function addLocalSavedId(placeId: number): number[] {
  const next = [...new Set([...loadLocalSavedIds(), placeId])]
  persistLocalSavedIds(next)
  return next
}

export function removeLocalSavedId(placeId: number): number[] {
  const next = loadLocalSavedIds().filter(id => id !== placeId)
  persistLocalSavedIds(next)
  return next
}

/** Stub — wire to Nostr kind list event when relay sync ships. */
export async function syncSavedMerchantsNostr(_npub: string, placeIds: number[]): Promise<{ synced: false; reason: string }> {
  // TODO(kind-event): nostr-tools SimplePool.publish replaceable list with merchant tags
  persistLocalSavedIds(placeIds)
  return { synced: false, reason: 'nostr_kind_event_stub' }
}