import { getEventHash, type EventTemplate } from 'nostr-tools/pure'
import type { ProgramUpdateEvent } from './nostrEvents'

/** Placeholder npub for unsigned publish stubs — event id only, not broadcastable. */
export const MOTOPASS_NOSTR_STUB_PUBKEY = '0'.repeat(64)

/** NIP-01 event id stub — SHA-256 of serialized unsigned event (no signature). */
export function nostrEventIdStub(event: EventTemplate | ProgramUpdateEvent): string {
  return getEventHash({
    ...event,
    pubkey: 'pubkey' in event && event.pubkey ? event.pubkey : MOTOPASS_NOSTR_STUB_PUBKEY,
  })
}