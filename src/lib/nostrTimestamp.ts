import type { Event } from 'nostr-tools'
import { hasNostrExtension } from './nostr'
import { nostrEventIdStub } from './nostrEventId'
import type { ProgramUpdateEvent } from './nostrEvents'
import { serializeNostrEvent } from './nostrEvents'
import { publishEvent, relayStatusSummary } from './nostrRelay'
import { signedEventMatchesTemplate, validateTimestampTemplate } from './timestampSecurity'

export type TimestampRecovery = 'published' | 'signed-unpublished' | 'stub' | 'rejected'

export type TimestampPublishResult = {
  signed: boolean
  published: boolean
  json: string
  eventId: string
  recovery: TimestampRecovery
  relaySummary?: string
  error?: string
}

function isSignedEvent(value: unknown): value is Event {
  if (!value || typeof value !== 'object') return false
  const e = value as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    typeof e.sig === 'string' &&
    typeof e.pubkey === 'string' &&
    typeof e.content === 'string' &&
    Array.isArray(e.tags)
  )
}

/**
 * Sign a Satohash-tagged timestamp event with NIP-07 and publish to relays.
 * Never throws. Without an extension, returns an unsigned copyable stub.
 */
export async function announceTimestampOnNostr(
  event: ProgramUpdateEvent,
): Promise<TimestampPublishResult> {
  const json = serializeNostrEvent(event)
  const stubId = nostrEventIdStub(event)
  const check = validateTimestampTemplate(event)
  if (!check.ok) {
    return {
      signed: false,
      published: false,
      json,
      eventId: stubId,
      recovery: 'rejected',
      error: check.error,
    }
  }

  if (!hasNostrExtension() || !window.nostr?.signEvent) {
    return { signed: false, published: false, json, eventId: stubId, recovery: 'stub' }
  }

  try {
    const signed = await window.nostr.signEvent({
      kind: event.kind,
      created_at: event.created_at,
      tags: event.tags,
      content: event.content,
    })

    if (!isSignedEvent(signed)) {
      return {
        signed: false,
        published: false,
        json,
        eventId: stubId,
        recovery: 'rejected',
        error: 'NIP-07 did not return a signed event',
      }
    }

    if (!signedEventMatchesTemplate(signed, event)) {
      return {
        signed: false,
        published: false,
        json,
        eventId: stubId,
        recovery: 'rejected',
        error: 'Signer returned a different event — publish aborted',
      }
    }

    const results = await publishEvent(signed)
    const published = results.some(r => r.ok)
    return {
      signed: true,
      published,
      json: JSON.stringify(signed, null, 2),
      eventId: signed.id,
      recovery: published ? 'published' : 'signed-unpublished',
      relaySummary: relayStatusSummary(results),
      error: published ? undefined : 'Signed locally — no relay accepted (keep the JSON)',
    }
  } catch (err) {
    return {
      signed: false,
      published: false,
      json,
      eventId: stubId,
      recovery: 'stub',
      error: err instanceof Error ? err.message : 'Nostr sign/publish failed',
    }
  }
}
