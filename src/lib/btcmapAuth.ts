import { getToken } from 'nostr-tools/nip98'
import type { Event, EventTemplate } from 'nostr-tools'
import { hasNostrExtension } from './nostr'

const TOKEN_KEY = 'motopass-btcmap-token'
const API_BASE = import.meta.env.VITE_BTCMAP_API_URL || 'https://api.btcmap.org'

export type BtcMapAuthSession = {
  token: string
  username: string
  npub: string
}

function storage(): Storage | null {
  return typeof sessionStorage !== 'undefined' ? sessionStorage : null
}

export function getBtcMapToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null
}

export function clearBtcMapToken(): void {
  storage()?.removeItem(TOKEN_KEY)
}

export function storeBtcMapSession(session: BtcMapAuthSession): void {
  storage()?.setItem(TOKEN_KEY, session.token)
}

export async function signInBtcMapWithNostr(): Promise<BtcMapAuthSession | null> {
  if (!hasNostrExtension() || !window.nostr?.signEvent) return null

  const loginUrl = `${API_BASE}/v4/auth/nostr`
  const sign = (e: EventTemplate) => window.nostr!.signEvent(e) as Promise<Event>
  const nostrAuth = await getToken(loginUrl, 'POST', sign, true)

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { Authorization: nostrAuth },
  })
  if (!res.ok) return null

  const data = (await res.json()) as BtcMapAuthSession
  storeBtcMapSession(data)
  return data
}