import { SimplePool, getEventHash, verifyEvent, type Event, type Filter } from 'nostr-tools'
import { finalizeEvent, generateSecretKey, getPublicKey, type EventTemplate } from 'nostr-tools/pure'
import * as nip04 from 'nostr-tools/nip04'
import { signedEventMatchesTemplate } from './timestampSecurity'
import type { LedgerSigner } from './nostrLedger'

/**
 * NIP-46 remote signing, for the visitors a browser extension cannot serve.
 *
 * Two ways in: paste a `bunker://` connection, or generate a `nostrconnect://`
 * URI and let a signer app (Amber, nsec.app, …) approve it. The client key is
 * generated in this tab and never persisted; the remote signer holds the user's
 * key and decides what each request may do.
 *
 * Transport is injected so the protocol can be tested without a relay. The
 * browser adapter is `createRelayTransport`. NIP-04 is used for the envelope:
 * it is what NIP-46 signers widely implement, and it is not a claim of
 * forward secrecy.
 */

const HEX64 = /^[a-f0-9]{64}$/i

export interface Nip46Filter {
  kinds: number[]
  authors?: string[]
  '#p': string[]
}

export interface Nip46Subscription {
  close: () => void
}

export interface Nip46Transport {
  publish: (event: Event) => void | Promise<void>
  subscribe: (filter: Nip46Filter, onEvent: (event: Event) => void) => Nip46Subscription
}

export type Nip46Result = { ok: true; result: unknown } | { ok: false; error: string }

export interface BunkerConnection {
  remotePubkey: string
  relays: string[]
  secret: string | null
}

function wss(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'wss:' && !url.username && !url.password
  } catch {
    return false
  }
}

/** Parse `bunker://<remote-pubkey>?relay=wss://…&secret=…`. */
export function parseBunkerUri(raw: string): BunkerConnection | null {
  const input = raw.trim()
  if (!input.toLowerCase().startsWith('bunker://')) return null
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }
  const remotePubkey = url.hostname.toLowerCase()
  if (!HEX64.test(remotePubkey)) return null
  const relays = url.searchParams
    .getAll('relay')
    .map(relay => relay.trim())
    .filter(wss)
  if (relays.length === 0) return null
  const secret = url.searchParams.get('secret')?.trim() || null
  return { remotePubkey, relays, secret }
}

export function nip46RequestEvent(
  secret: Uint8Array,
  remotePubkey: string,
  method: string,
  params: unknown[] = [],
  id: string,
  now: number = Math.floor(Date.now() / 1000),
): Event {
  const template: EventTemplate = {
    kind: 24133,
    created_at: now,
    tags: [['p', remotePubkey]],
    content: nip04.encrypt(secret, remotePubkey, JSON.stringify({ id, method, params })),
  }
  return finalizeEvent(template, secret)
}

export type Nip46Decoded =
  | { ok: true; id: string; result: unknown }
  | { ok: false; error: string }

/** Decrypt and attribute one signer message. Unknown shapes are errors. */
export function readNip46Message(
  secret: Uint8Array,
  remotePubkey: string,
  event: Pick<Event, 'kind' | 'pubkey' | 'content'>,
): Nip46Decoded {
  if (event.kind !== 24133) return { ok: false, error: 'Not a NIP-46 message' }
  if (event.pubkey.toLowerCase() !== remotePubkey.toLowerCase()) {
    return { ok: false, error: 'Message is not from the connected signer' }
  }
  let payload: unknown
  try {
    payload = JSON.parse(nip04.decrypt(secret, remotePubkey, event.content))
  } catch {
    return { ok: false, error: 'Message could not be decrypted' }
  }
  if (!payload || typeof payload !== 'object') return { ok: false, error: 'Empty signer message' }
  const data = payload as { id?: unknown; result?: unknown; error?: unknown }
  if (typeof data.id !== 'string') return { ok: false, error: 'Signer message had no request id' }
  if (data.error != null) {
    if (typeof data.error === 'string') return { ok: false, error: data.error }
    const err = data.error as { code?: unknown; message?: unknown }
    const code = typeof err.code === 'string' ? err.code : null
    const message = typeof err.message === 'string' ? err.message : 'Signer refused the request'
    return { ok: false, error: code ? `${code}: ${message}` : message }
  }
  return { ok: true, id: data.id, result: data.result }
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

/**
 * Send one request and wait for the signer's answer with the same id.
 * Never throws. A forged or foreign event is ignored rather than trusted.
 */
export async function nip46Request(
  transport: Nip46Transport,
  secret: Uint8Array,
  remotePubkey: string,
  method: string,
  params: unknown[] = [],
  opts: { timeoutMs?: number; id?: string } = {},
): Promise<Nip46Result> {
  const clientPubkey = getPublicKey(secret)
  const id = opts.id ?? randomId()
  let request: Event
  try {
    request = nip46RequestEvent(secret, remotePubkey, method, params, id)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not build request' }
  }

  const timeoutMs = opts.timeoutMs ?? 60_000
  return await new Promise<Nip46Result>(resolve => {
    let settled = false
    let sub: Nip46Subscription | undefined

    const finish = (result: Nip46Result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        sub?.close()
      } catch {
        /* already closed */
      }
      resolve(result)
    }

    const timer = setTimeout(
      () => finish({ ok: false, error: `Signer did not answer within ${Math.round(timeoutMs / 1000)}s` }),
      timeoutMs,
    )

    try {
      sub = transport.subscribe({ kinds: [24133], authors: [remotePubkey], '#p': [clientPubkey] }, event => {
        if (!verifyEvent(event)) return
        const decoded = readNip46Message(secret, remotePubkey, event)
        if (!decoded.ok) {
          finish(decoded)
          return
        }
        // The payload id is the NIP-46 request id we generated — not the
        // nostr event id of the envelope.
        if (decoded.id !== id) return
        finish({ ok: true, result: decoded.result })
      })
      void Promise.resolve(transport.publish(request)).catch(err => {
        finish({ ok: false, error: err instanceof Error ? err.message : 'Could not reach the signer relay' })
      })
    } catch (err) {
      finish({ ok: false, error: err instanceof Error ? err.message : 'Relay connection failed' })
    }
  })
}

function isSignedLike(value: unknown): value is Event {
  if (!value || typeof value !== 'object') return false
  const e = value as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    typeof e.pubkey === 'string' &&
    typeof e.sig === 'string' &&
    typeof e.kind === 'number' &&
    typeof e.created_at === 'number' &&
    typeof e.content === 'string' &&
    Array.isArray(e.tags)
  )
}

/** `sign_event`, then verify the signer returned exactly what was asked. */
export async function nip46SignEvent(
  transport: Nip46Transport,
  secret: Uint8Array,
  remotePubkey: string,
  template: { kind: number; created_at: number; tags: string[][]; content: string },
  opts: { timeoutMs?: number } = {},
): Promise<{ ok: true; event: Event } | { ok: false; error: string }> {
  const response = await nip46Request(
    transport,
    secret,
    remotePubkey,
    'sign_event',
    [JSON.stringify(template)],
    opts,
  )
  if (!response.ok) return response
  let signed: unknown = response.result
  if (typeof signed === 'string') {
    try {
      signed = JSON.parse(signed)
    } catch {
      return { ok: false, error: 'Signer returned an unreadable event' }
    }
  }
  if (!isSignedLike(signed)) return { ok: false, error: 'Signer did not return an event' }
  if (!signedEventMatchesTemplate(signed, template)) {
    return { ok: false, error: 'Signer returned a different event — publish aborted' }
  }
  if (signed.id !== getEventHash(signed) || !verifyEvent(signed)) {
    return { ok: false, error: 'Signature failed verification' }
  }
  return { ok: true, event: signed }
}

export interface NostrConnectSession {
  secret: Uint8Array
  clientPubkey: string
  appSecret: string
  uri: string
  waitForSigner: (transport: Nip46Transport, opts?: { timeoutMs?: number }) => Promise<
    { ok: true; remotePubkey: string } | { ok: false; error: string }
  >
}

/**
 * Client-initiated pairing: show `nostrconnect://…`, wait for a signer to
 * connect with the matching app secret, and hand back its pubkey.
 */
export function createNostrConnectSession(opts: {
  relays: string[]
  name?: string
  appSecret?: string
}): NostrConnectSession | null {
  const relays = opts.relays.map(relay => relay.trim()).filter(wss)
  if (relays.length === 0) return null
  const secret = generateSecretKey()
  const clientPubkey = getPublicKey(secret)
  const appSecret = opts.appSecret ?? randomId().replace(/-/g, '')
  if (!appSecret) return null

  const query = new URLSearchParams()
  for (const relay of relays) query.append('relay', relay)
  query.set('secret', appSecret)
  if (opts.name) query.set('name', opts.name)
  const uri = `nostrconnect://${clientPubkey}?${query.toString()}`

  return {
    secret,
    clientPubkey,
    appSecret,
    uri,
    waitForSigner: (transport, waitOpts = {}) => {
      const timeoutMs = waitOpts.timeoutMs ?? 120_000
      return new Promise(resolve => {
        let settled = false
        let sub: Nip46Subscription | undefined
        const finish = (result: { ok: true; remotePubkey: string } | { ok: false; error: string }) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          try {
            sub?.close()
          } catch {
            /* already closed */
          }
          resolve(result)
        }
        const timer = setTimeout(
          () => finish({ ok: false, error: `No signer connected within ${Math.round(timeoutMs / 1000)}s` }),
          timeoutMs,
        )
        try {
          sub = transport.subscribe({ kinds: [24133], '#p': [clientPubkey] }, event => {
            if (!verifyEvent(event)) return
            const remotePubkey = event.pubkey.toLowerCase()
            let payload: { method?: unknown; params?: unknown }
            try {
              payload = JSON.parse(nip04.decrypt(secret, remotePubkey, event.content))
            } catch {
              return
            }
            if (payload.method !== 'connect') return
            const params = Array.isArray(payload.params) ? payload.params : []
            // The secret must match the one in the URI we displayed.
            if (params[0] !== appSecret) return
            finish({ ok: true, remotePubkey })
          })
        } catch (err) {
          finish({ ok: false, error: err instanceof Error ? err.message : 'Relay connection failed' })
        }
      })
    },
  }
}

/** A signer bound to one pairing, in the shape the ledger publisher expects. */
export function nip46Signer(
  transport: Nip46Transport,
  secret: Uint8Array,
  remotePubkey: string,
  opts: { timeoutMs?: number } = {},
): LedgerSigner {
  return async template => {
    const signed = await nip46SignEvent(transport, secret, remotePubkey, template, opts)
    if (!signed.ok) throw new Error(signed.error)
    return signed.event
  }
}

/** Browser transport over real relays. Injected so tests never open a socket. */
export function createRelayTransport(relays: string[]): Nip46Transport & { destroy: () => void } {
  const pool = new SimplePool()
  return {
    async publish(event) {
      const attempts: Promise<string>[] = relays.flatMap(relay => pool.publish([relay], event))
      if (attempts.length === 0) throw new Error('No relays configured')
      await new Promise<void>((resolve, reject) => {
        let pending = attempts.length
        let settled = false
        for (const attempt of attempts) {
          attempt.then(
            () => {
              if (settled) return
              settled = true
              resolve()
            },
            (err: unknown) => {
              pending -= 1
              if (pending === 0 && !settled) reject(err)
            },
          )
        }
      })
    },
    subscribe(filter, onEvent) {
      const relayFilter: Filter = { kinds: filter.kinds, '#p': filter['#p'] }
      if (filter.authors) relayFilter.authors = filter.authors
      return pool.subscribeMany(relays, relayFilter, { onevent: onEvent })
    },
    destroy() {
      pool.destroy()
    },
  }
}
