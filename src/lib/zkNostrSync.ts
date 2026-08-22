import {
  nip19,
  nip44,
  SimplePool,
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  verifyEvent,
  type Event,
} from 'nostr-tools'
import { MOTOPASS_RELAYS } from './nostr'

// ═══════════════════════════════════════════════════════════════════════════════
// MotoPass zero-knowledge persistence (Adv5) — NIP-44 v2 encrypted Nostr events.
//
// DOCTRINE (Sherpa §4.2, zero-knowledge guide t_0595b87e):
//  - The user owns the key. MotoPass never generates-required, holds, sees or
//    custodians the user's Nostr nsec. It is generated on-device (or brought by
//    the user) and stays on-device.
//  - Prefs/state ride as NIP-44 v2 encrypted events (version 0x02) to our relay
//    + public relays. Servers/relays see only: pubkey, timestamp, kind, tags,
//    and ciphertext. Never plaintext, never the key.
//  - No key = full functionality, session-only. This module is OPTIONAL sync;
//    it must never gate a core feature. localStorage remains the session layer.
//
// RUSTSEC-2026-0227 mitigation (Sherpa-flagged, applied here):
//  The NIP-44 v2 decrypt entry point must validate length/version BEFORE full
//  base64 decode + HMAC. nostr-tools' nip44.decrypt checks the *minimums*
//  (132 base64 chars / 99 decoded bytes) but NOT a maximum — an attacker who can
//  inject an event (malicious relay/author) could otherwise force a full decode
//  + HMAC of an arbitrarily large payload (resource exhaustion / DoS). We gate
//  the entry point here with an early max-size check (and the spec's other
//  pre-checks) before any library decode/HMAC runs.
// ═══════════════════════════════════════════════════════════════════════════════

/** NIP-44 v2 spec: minimum encoded payload length (base64 chars). */
export const NIP44_MIN_BASE64_LEN = 132
/** NIP-44 v2 spec: minimum decoded payload length (bytes). */
export const NIP44_MIN_DECODED_LEN = 99
/**
 * Early max-size gate (RUSTSEC-2026-0227 mitigation). This is the largest
 * encoded payload we will ever legitimately decrypt. The MotoPass relay caps
 * events at 64 KB (max_event_bytes), so no valid persisted blob can exceed
 * this — enforcing it here blocks the oversized-payload DoS before allocation
 * and HMAC. (Theoretical NIP-44 max is ~4 GB; we bound to our own use case.)
 */
export const NIP44_MAX_BASE64_LEN = 65_536
/** NIP-44 v2 version byte. */
export const NIP44_V2_VERSION = 2

/** NIP-78 app-specific data kind — standard home for addressable app state. */
export const MOTOPASS_STATE_KIND = 30078
/** Addressable-event `d` tag — stable key for "the MotoPass prefs blob". */
export const MOTOPASS_STATE_D_TAG = 'motopass:prefs'

export interface MotoPassZkKeypair {
  /** Bech32 nsec (private) — user-held, never leaves the device. */
  nsec: string
  /** Bech32 npub (public) — the pseudonymous identity. */
  npub: string
  /** 32-byte hex public key. */
  pubkey: string
}

/** Versioned state blob the user can persist across devices. */
export interface MotoPassSyncState {
  version: 1
  lang?: string
  displayCurrency?: string
  recentLangs?: string[]
  /** Paige / simulator memory — ephemeral client-held by default, optional sync. */
  simulator?: Record<string, unknown>
  updatedAt: number
}

/**
 * RUSTSEC-2026-0227-hardened NIP-44 v2 decrypt entry point.
 * Validates shape/length/version BEFORE any full decode or HMAC work.
 * Throws on invalid input; returns the plaintext string.
 */
export function decryptNip44Payload(payload: unknown, conversationKey: Uint8Array): string {
  if (typeof payload !== 'string') {
    throw new Error('NIP-44 payload must be a string')
  }
  const len = payload.length
  // Spec §Decryption: minimum encoded length (prevents base64-decoder DoS).
  if (len < NIP44_MIN_BASE64_LEN) {
    throw new Error(`NIP-44 payload too short: ${len} < ${NIP44_MIN_BASE64_LEN}`)
  }
  // RUSTSEC-2026-0227 mitigation: reject oversized payloads EARLY, before
  // base64 allocation / HMAC processing (nostr-tools decrypt lacks a max).
  if (len > NIP44_MAX_BASE64_LEN) {
    throw new Error(`NIP-44 payload exceeds max: ${len} > ${NIP44_MAX_BASE64_LEN}`)
  }
  // Optional future-proof flag: non-base64 payloads are unsupported versions.
  if (payload[0] === '#') {
    throw new Error('NIP-44 payload uses an unsupported (non-base64) version')
  }
  // Library then validates: version byte == 0x02, decoded >= 99 bytes,
  // constant-time MAC, padding. Its own min-checks remain as defense in depth.
  return nip44.v2.decrypt(payload, conversationKey)
}

/** Generate a fresh user-owned keypair on-device. Nothing leaves the device. */
export function generateZkKeypair(): MotoPassZkKeypair {
  const sk = generateSecretKey()
  const pubkey = getPublicKey(sk)
  return {
    nsec: nip19.nsecEncode(sk),
    npub: nip19.npubEncode(pubkey),
    pubkey,
  }
}

/** Rebuild the keypair object from a user-supplied nsec (bring-your-own-key). */
export function keypairFromNsec(nsec: string): MotoPassZkKeypair {
  const decoded = nip19.decode(nsec)
  if (decoded.type !== 'nsec') {
    throw new Error('Expected an nsec (Nostr private key)')
  }
  const sk = decoded.data as Uint8Array
  const pubkey = getPublicKey(sk)
  return {
    nsec: nip19.nsecEncode(sk),
    npub: nip19.npubEncode(pubkey),
    pubkey,
  }
}

/**
 * Conversation key for self-encryption: ECDH of the user's own key with
 * themselves. Symmetric in both directions — conv(A,A) is deterministic, so the
 * same blob decrypts with the same nsec on any device.
 */
export function conversationKeyFromKeypair(kp: MotoPassZkKeypair): Uint8Array {
  const sk = nip19.decode(kp.nsec)
  if (sk.type !== 'nsec') throw new Error('Expected an nsec')
  return nip44.v2.utils.getConversationKey(sk.data as Uint8Array, kp.pubkey)
}

/** Encrypt state to ciphertext (NIP-44 v2). Pure, no network. */
export function encryptState(state: MotoPassSyncState, kp: MotoPassZkKeypair): string {
  const conversationKey = conversationKeyFromKeypair(kp)
  return nip44.v2.encrypt(JSON.stringify(state), conversationKey)
}

/** Decrypt ciphertext to state. Uses the RUSTSEC-2026-0227-mitigated entry point. */
export function decryptState(ciphertext: unknown, kp: MotoPassZkKeypair): MotoPassSyncState {
  const conversationKey = conversationKeyFromKeypair(kp)
  const plaintext = decryptNip44Payload(ciphertext, conversationKey)
  const parsed = JSON.parse(plaintext) as MotoPassSyncState
  if (typeof parsed.version !== 'number') {
    throw new Error('Decrypted state is missing a version field')
  }
  return parsed
}

/**
 * Publish the user's state as a signed, NIP-44-v2-encrypted NIP-01 event.
 * Relays see ciphertext + pubkey + timestamp + tags only. Returns the event id.
 * `relays` defaults to the full MotoPass set (our relay + public mirrors); pass
 * a narrower list (e.g. just our relay) for onboarding/first-write flows.
 */
export async function saveEncryptedState(
  state: MotoPassSyncState,
  kp: MotoPassZkKeypair,
  relays: string[] = MOTOPASS_RELAYS,
): Promise<string> {
  const sk = nip19.decode(kp.nsec)
  if (sk.type !== 'nsec') throw new Error('Expected an nsec')
  const content = encryptState(state, kp)
  const event = finalizeEvent(
    {
      kind: MOTOPASS_STATE_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['d', MOTOPASS_STATE_D_TAG]],
      content,
    },
    sk.data as Uint8Array,
  )
  const pool = new SimplePool()
  try {
    await pool.publish(relays, event)
  } finally {
    pool.close(relays)
  }
  return event.id
}

/**
 * Load the user's latest persisted state from the relays and decrypt it.
 * Returns null when nothing is persisted. Any tampered/oversized/malformed
 * event is rejected by the hardened entry point (throws).
 */
export async function loadEncryptedState(
  kp: MotoPassZkKeypair,
  relays: string[] = MOTOPASS_RELAYS,
): Promise<MotoPassSyncState | null> {
  const pool = new SimplePool()
  try {
    const events: Event[] = await pool.querySync(relays, {
      kinds: [MOTOPASS_STATE_KIND],
      authors: [kp.pubkey],
      '#d': [MOTOPASS_STATE_D_TAG],
    })
    if (!events.length) return null
    // Prefer the newest authored blob, verify its signature, then decrypt.
    events.sort((a, b) => b.created_at - a.created_at)
    const latest = events[0]
    if (!verifyEvent(latest)) {
      throw new Error('Persisted state event failed signature verification')
    }
    return decryptState(latest.content, kp)
  } finally {
    pool.close(relays)
  }
}
