import { describe, expect, it } from 'vitest'
import { finalizeEvent, generateSecretKey, getPublicKey, type Event } from 'nostr-tools/pure'
import * as nip04 from 'nostr-tools/nip04'
import {
  createNostrConnectSession,
  nip46Request,
  nip46SignEvent,
  parseBunkerUri,
  readNip46Message,
  type Nip46Filter,
  type Nip46Subscription,
  type Nip46Transport,
} from './nip46'

const REMOTE_SECRET = generateSecretKey()
const REMOTE_PUBKEY = getPublicKey(REMOTE_SECRET)
const USER_SECRET = generateSecretKey()
const USER_PUBKEY = getPublicKey(USER_SECRET)
const CLIENT_SECRET = generateSecretKey()

/** A fake signer that speaks the protocol over the injected transport. */
class FakeSigner implements Nip46Transport {
  handlers: Array<(event: Event) => void> = []
  constructor(
    private readonly behaviour: { signContent?: string } = {},
    private readonly remoteSecret: Uint8Array = REMOTE_SECRET,
  ) {}

  async publish(event: Event): Promise<void> {
    const payload = JSON.parse(nip04.decrypt(this.remoteSecret, event.pubkey, event.content)) as {
      id: string
      method: string
      params: unknown[]
    }
    let result: unknown = null
    let error: unknown = null
    if (payload.method === 'connect') result = 'ack'
    else if (payload.method === 'get_public_key') result = USER_PUBKEY
    else if (payload.method === 'sign_event') {
      const template = JSON.parse(String(payload.params[0])) as {
        kind: number
        created_at: number
        tags: string[][]
        content: string
      }
      const signed = finalizeEvent(
        this.behaviour.signContent != null ? { ...template, content: this.behaviour.signContent } : template,
        USER_SECRET,
      )
      result = JSON.stringify(signed)
    } else {
      error = { code: 'UNSUPPORTED', message: payload.method }
    }

    const response = finalizeEvent(
      {
        kind: 24133,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['p', event.pubkey],
          ['e', event.id],
        ],
        content: nip04.encrypt(this.remoteSecret, event.pubkey, JSON.stringify({ id: payload.id, result, error })),
      },
      this.remoteSecret,
    )
    queueMicrotask(() => this.handlers.forEach(handler => handler(response)))
  }

  subscribe(_filter: Nip46Filter, onEvent: (event: Event) => void): Nip46Subscription {
    this.handlers.push(onEvent)
    return { close: () => { this.handlers = this.handlers.filter(handler => handler !== onEvent) } }
  }
}

describe('parseBunkerUri', () => {
  it('accepts repeated wss relays and an optional secret', () => {
    expect(
      parseBunkerUri(
        `bunker://${REMOTE_PUBKEY}?relay=${encodeURIComponent('wss://relay.one.example')}&relay=${encodeURIComponent('wss://relay.two.example')}&secret=abc`,
      ),
    ).toEqual({
      remotePubkey: REMOTE_PUBKEY,
      relays: ['wss://relay.one.example', 'wss://relay.two.example'],
      secret: 'abc',
    })
  })

  it('rejects a bad key, an http relay or no relay at all', () => {
    expect(parseBunkerUri(`bunker://not-hex?relay=${encodeURIComponent('wss://relay.example')}`)).toBeNull()
    expect(parseBunkerUri(`bunker://${REMOTE_PUBKEY}?relay=${encodeURIComponent('https://relay.example')}`)).toBeNull()
    expect(parseBunkerUri(`bunker://${REMOTE_PUBKEY}`)).toBeNull()
    expect(parseBunkerUri('nostrconnect://whatever')).toBeNull()
  })
})

describe('nip46Request', () => {
  it('completes connect and reads the user pubkey', async () => {
    const signer = new FakeSigner()
    const connected = await nip46Request(signer, CLIENT_SECRET, REMOTE_PUBKEY, 'connect', [REMOTE_PUBKEY, ''])
    expect(connected).toEqual({ ok: true, result: 'ack' })
    const who = await nip46Request(signer, CLIENT_SECRET, REMOTE_PUBKEY, 'get_public_key', [])
    expect(who).toEqual({ ok: true, result: USER_PUBKEY })
  })

  it('surfaces a refusal from the signer', async () => {
    const signer = new FakeSigner()
    const result = await nip46Request(signer, CLIENT_SECRET, REMOTE_PUBKEY, 'pay_invoice', [])
    expect(result).toEqual({ ok: false, error: 'UNSUPPORTED: pay_invoice' })
  })

  it('ignores a response signed by someone else', async () => {
    const transport: Nip46Transport = {
      publish: async () => {
        throw new Error('relay refused')
      },
      subscribe: () => ({ close: () => {} }),
    }
    const result = await nip46Request(transport, CLIENT_SECRET, REMOTE_PUBKEY, 'connect', [], { timeoutMs: 120 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('relay refused')
  })
})

describe('nip46SignEvent', () => {
  const template = {
    kind: 30078,
    created_at: 1_760_000_000,
    tags: [['d', 'motopass-audit-pa-2026-11-09-gov_fees-0']],
    content: JSON.stringify({ field: 'gov_fees' }),
  }

  it('returns a verified event that matches the template', async () => {
    const signer = new FakeSigner()
    const result = await nip46SignEvent(signer, CLIENT_SECRET, REMOTE_PUBKEY, template)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.event.content).toBe(template.content)
      expect(result.event.created_at).toBe(template.created_at)
      expect(result.event.pubkey).toBe(USER_PUBKEY)
    }
  })

  it('refuses a signer that changes the content', async () => {
    const signer = new FakeSigner({ signContent: '{"field":"something-else"}' })
    expect(await nip46SignEvent(signer, CLIENT_SECRET, REMOTE_PUBKEY, template)).toEqual({
      ok: false,
      error: 'Signer returned a different event — publish aborted',
    })
  })
})

describe('readNip46Message', () => {
  it('rejects a foreign author, the wrong kind and junk ciphertext', () => {
    const other = generateSecretKey()
    expect(readNip46Message(CLIENT_SECRET, REMOTE_PUBKEY, { kind: 24133, pubkey: getPublicKey(other), content: 'x' })).toEqual({
      ok: false,
      error: 'Message is not from the connected signer',
    })
    expect(readNip46Message(CLIENT_SECRET, REMOTE_PUBKEY, { kind: 1, pubkey: REMOTE_PUBKEY, content: 'x' })).toEqual({
      ok: false,
      error: 'Not a NIP-46 message',
    })
    expect(readNip46Message(CLIENT_SECRET, REMOTE_PUBKEY, { kind: 24133, pubkey: REMOTE_PUBKEY, content: 'nope' }).ok).toBe(false)
  })
})

describe('createNostrConnectSession', () => {
  it('puts relays and the app secret in the URI and accepts a matching connect', async () => {
    const session = createNostrConnectSession({
      relays: ['wss://relay.example.com'],
      name: 'MotoPass',
      appSecret: 's3cret',
    })
    expect(session).not.toBeNull()
    if (!session) return
    expect(session.uri).toContain(`nostrconnect://${session.clientPubkey}`)
    expect(session.uri).toContain('secret=s3cret')
    expect(session.uri).toContain('name=MotoPass')

    const handlers: Array<(event: Event) => void> = []
    const transport: Nip46Transport = {
      publish: () => {},
      subscribe: (_filter, onEvent) => {
        handlers.push(onEvent)
        return { close: () => {} }
      },
    }
    const remoteSecret = generateSecretKey()
    const remotePubkey = getPublicKey(remoteSecret)
    const connect = finalizeEvent(
      {
        kind: 24133,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', session.clientPubkey]],
        content: nip04.encrypt(remoteSecret, session.clientPubkey, JSON.stringify({ id: 'x', method: 'connect', params: ['s3cret'] })),
      },
      remoteSecret,
    )
    queueMicrotask(() => handlers.forEach(handler => handler(connect)))

    expect(await session.waitForSigner(transport, { timeoutMs: 500 })).toEqual({ ok: true, remotePubkey })
  })

  it('ignores a connect with the wrong secret', async () => {
    const session = createNostrConnectSession({ relays: ['wss://relay.example.com'], appSecret: 'right' })
    expect(session).not.toBeNull()
    if (!session) return
    const handlers: Array<(event: Event) => void> = []
    const transport: Nip46Transport = {
      publish: () => {},
      subscribe: (_filter, onEvent) => {
        handlers.push(onEvent)
        return { close: () => {} }
      },
    }
    const remoteSecret = generateSecretKey()
    const connect = finalizeEvent(
      {
        kind: 24133,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', session.clientPubkey]],
        content: nip04.encrypt(remoteSecret, session.clientPubkey, JSON.stringify({ id: 'x', method: 'connect', params: ['wrong'] })),
      },
      remoteSecret,
    )
    queueMicrotask(() => handlers.forEach(handler => handler(connect)))
    const result = await session.waitForSigner(transport, { timeoutMs: 150 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('No signer connected')
  })
})
