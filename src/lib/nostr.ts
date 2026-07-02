import { nip19 } from 'nostr-tools'

export const MOTOPASS_RELAYS = [
  import.meta.env.VITE_NOSTR_RELAY || 'wss://relay.motopass.giveabit.io',
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