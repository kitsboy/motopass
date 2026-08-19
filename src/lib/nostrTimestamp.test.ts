import { afterEach, describe, expect, it, vi } from 'vitest'
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'
import { buildTimestampAttestationEvent } from './nostrEvents'

vi.mock('./nostrRelay', () => ({
  publishEvent: vi.fn(),
  relayStatusSummary: (results: { ok: boolean }[]) =>
    `${results.filter(r => r.ok).length}/${results.length} relays accepted`,
}))

import { publishEvent } from './nostrRelay'
import { announceTimestampOnNostr } from './nostrTimestamp'

const event = buildTimestampAttestationEvent({
  hash: 'aa'.repeat(32),
  satohashUrl: 'https://satohash.io/verify/s1',
  stampId: 's1',
  blockHeight: 900001,
})

describe('announceTimestampOnNostr', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns unsigned stub when no NIP-07 extension', async () => {
    const result = await announceTimestampOnNostr(event)
    expect(result.signed).toBe(false)
    expect(result.published).toBe(false)
    expect(result.recovery).toBe('stub')
    expect(result.eventId).toMatch(/^[a-f0-9]{64}$/)
    expect(result.json).toContain('timestamp-attestation')
    expect(publishEvent).not.toHaveBeenCalled()
  })

  it('signs and publishes when NIP-07 returns a valid signed event', async () => {
    const sk = generateSecretKey()
    const signed = finalizeEvent(
      {
        kind: event.kind,
        created_at: event.created_at,
        tags: event.tags,
        content: event.content,
      },
      sk,
    )
    vi.stubGlobal('window', {
      nostr: {
        getPublicKey: vi.fn(),
        signEvent: vi.fn().mockResolvedValue(signed),
      },
    })
    vi.mocked(publishEvent).mockResolvedValue([
      { ok: true, relay: 'wss://relay.damus.io' },
      { ok: false, relay: 'wss://nos.lol', error: 'timeout' },
    ])

    const result = await announceTimestampOnNostr(event)
    expect(result.signed).toBe(true)
    expect(result.published).toBe(true)
    expect(result.recovery).toBe('published')
    expect(result.eventId).toBe(signed.id)
    expect(result.relaySummary).toBe('1/2 relays accepted')
    expect(publishEvent).toHaveBeenCalledWith(signed)
  })

  it('rejects a signer payload whose id or signature is forged', async () => {
    const sk = generateSecretKey()
    const signed = finalizeEvent(
      {
        kind: event.kind,
        created_at: event.created_at,
        tags: event.tags,
        content: event.content,
      },
      sk,
    )
    vi.stubGlobal('window', {
      nostr: {
        getPublicKey: vi.fn(),
        signEvent: vi.fn().mockResolvedValue({ ...signed, id: 'ab'.repeat(32) }),
      },
    })
    const result = await announceTimestampOnNostr(event)
    expect(result.recovery).toBe('rejected')
    expect(result.published).toBe(false)
    expect(result.error).toMatch(/id|signature|hash/i)
    expect(publishEvent).not.toHaveBeenCalled()
  })

  it('aborts publish when signer swaps tags or content', async () => {
    vi.stubGlobal('window', {
      nostr: {
        getPublicKey: vi.fn(),
        signEvent: vi.fn().mockResolvedValue({
          ...event,
          id: 'ee'.repeat(32),
          pubkey: 'ff'.repeat(32),
          sig: '11'.repeat(32),
          content: '{"kind":"hijacked"}',
        }),
      },
    })
    const result = await announceTimestampOnNostr(event)
    expect(result.recovery).toBe('rejected')
    expect(result.published).toBe(false)
    expect(result.error).toMatch(/different event/i)
    expect(publishEvent).not.toHaveBeenCalled()
  })

  it('does not throw when signEvent fails', async () => {
    vi.stubGlobal('window', {
      nostr: {
        getPublicKey: vi.fn(),
        signEvent: vi.fn().mockRejectedValue(new Error('user rejected')),
      },
    })
    const result = await announceTimestampOnNostr(event)
    expect(result.signed).toBe(false)
    expect(result.published).toBe(false)
    expect(result.recovery).toBe('stub')
    expect(result.error).toMatch(/user rejected/)
    expect(publishEvent).not.toHaveBeenCalled()
  })
})
