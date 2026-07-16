import { nip19 } from 'nostr-tools'

const DEFAULT_PRIMARY_RELAY = 'wss://relay.motopass.giveabit.io'

/** Primary relay — override via `VITE_NOSTR_RELAY` in `.env.local`. */
export function getPrimaryNostrRelay(): string {
  const fromEnv = import.meta.env.VITE_NOSTR_RELAY?.trim()
  return fromEnv || DEFAULT_PRIMARY_RELAY
}

export const MOTOPASS_RELAYS = [
  getPrimaryNostrRelay(),
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
]

export interface NostrSession {
  pubkey: string
  npub: string
}

export async function connectNostr(): Promise<NostrSession | null> {
  if (!window.nostr) return null
  try {
    const pubkey = await window.nostr.getPublicKey()
    return { pubkey, npub: nip19.npubEncode(pubkey) }
  } catch {
    return null
  }
}

export function hasNostrExtension(): boolean {
  return typeof window !== 'undefined' && !!window.nostr
}