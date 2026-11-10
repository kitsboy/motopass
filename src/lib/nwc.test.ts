import { describe, it, expect } from 'vitest'
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import * as nip04 from 'nostr-tools/nip04'
import { buildNwcRequest, parseNwcInvoice, parseNwcLookup, parseNwcResponse, parseNwcUri } from './nwc'

const WALLET_SECRET = generateSecretKey()
const WALLET_PUBKEY = getPublicKey(WALLET_SECRET)
const CLIENT_SECRET = generateSecretKey()

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function uri(wallet = WALLET_PUBKEY, relay = 'wss://relay.example.com', secret = toHex(CLIENT_SECRET)) {
  return `nostr+walletconnect://${wallet}?relay=${encodeURIComponent(relay)}&secret=${secret}`
}

describe('parseNwcUri', () => {
  it('parses a valid connection string', () => {
    const parsed = parseNwcUri(uri())
    expect(parsed).toEqual({
      walletPubkey: WALLET_PUBKEY,
      relayUrl: 'wss://relay.example.com/',
      secret: toHex(CLIENT_SECRET),
    })
  })

  it('rejects the wrong scheme, a non-wss relay, bad hex and a missing secret', () => {
    expect(parseNwcUri('nostr://abc')).toBeNull()
    expect(parseNwcUri(uri(WALLET_PUBKEY, 'https://relay.example.com'))).toBeNull()
    expect(parseNwcUri(uri('not-hex'))).toBeNull()
    expect(parseNwcUri(`nostr+walletconnect://${WALLET_PUBKEY}?relay=wss%3A%2F%2Frelay.example.com`)).toBeNull()
    expect(parseNwcUri('')).toBeNull()
  })
})

describe('buildNwcRequest / parseNwcResponse', () => {
  it('encrypts a get_balance request the wallet can read', () => {
    const request = buildNwcRequest(CLIENT_SECRET, WALLET_PUBKEY, 'get_balance', {}, 1_700_000_000)
    expect(request.kind).toBe(23194)
    expect(request.created_at).toBe(1_700_000_000)
    expect(request.tags).toEqual([['p', WALLET_PUBKEY]])
    const plaintext = nip04.decrypt(WALLET_SECRET, request.pubkey, request.content)
    expect(JSON.parse(plaintext)).toEqual({ method: 'get_balance', params: {} })
  })

  it('decrypts a balance response into sats', () => {
    const content = nip04.encrypt(WALLET_SECRET, getPublicKey(CLIENT_SECRET), JSON.stringify({ result: { balance: 123_456_000 }, error: null }))
    const response = finalizeEvent({
      kind: 23195,
      created_at: 1_700_000_001,
      tags: [['e', 'request-id'], ['p', getPublicKey(CLIENT_SECRET)]],
      content,
    }, WALLET_SECRET)
    expect(parseNwcResponse(CLIENT_SECRET, WALLET_PUBKEY, response)).toEqual({
      ok: true,
      balanceMsat: 123_456_000,
      balanceSats: 123_456,
    })
  })

  it('surfaces a wallet error code', () => {
    const content = nip04.encrypt(WALLET_SECRET, getPublicKey(CLIENT_SECRET), JSON.stringify({
      result: null,
      error: { code: 'UNAUTHORIZED', message: 'no balance permission' },
    }))
    const response = { kind: 23195, pubkey: WALLET_PUBKEY, content }
    expect(parseNwcResponse(CLIENT_SECRET, WALLET_PUBKEY, response)).toEqual({
      ok: false,
      error: 'UNAUTHORIZED: no balance permission',
    })
  })

  it('refuses a response from another author, another kind, or junk ciphertext', () => {
    const other = generateSecretKey()
    expect(parseNwcResponse(CLIENT_SECRET, WALLET_PUBKEY, { kind: 23195, pubkey: getPublicKey(other), content: 'x' })).toEqual({
      ok: false,
      error: 'Response is not from the connected wallet',
    })
    expect(parseNwcResponse(CLIENT_SECRET, WALLET_PUBKEY, { kind: 1, pubkey: WALLET_PUBKEY, content: 'x' })).toEqual({
      ok: false,
      error: 'Not a NIP-47 response',
    })
    expect(parseNwcResponse(CLIENT_SECRET, WALLET_PUBKEY, { kind: 23195, pubkey: WALLET_PUBKEY, content: 'not-ciphertext' }).ok).toBe(false)
  })
})

const BOLT11 = `lnbc1${'q'.repeat(120)}`

function content(payload: unknown): string {
  return nip04.encrypt(WALLET_SECRET, getPublicKey(CLIENT_SECRET), JSON.stringify(payload))
}

describe('parseNwcInvoice', () => {
  it('accepts a BOLT11 with a payment hash and reads the msat amount', () => {
    expect(
      parseNwcInvoice({ invoice: BOLT11, payment_hash: 'A'.repeat(64), amount: 5_000_000 }),
    ).toEqual({
      ok: true,
      invoice: { bolt11: BOLT11, paymentHash: 'a'.repeat(64), amountMsat: 5_000_000 },
    })
  })

  it('refuses a non-invoice or an invoice without a hash', () => {
    expect(parseNwcInvoice({ invoice: 'hello', payment_hash: 'a'.repeat(64) })).toEqual({
      ok: false,
      error: 'Wallet did not return a BOLT11 invoice',
    })
    expect(parseNwcInvoice({ invoice: BOLT11, payment_hash: 'nope' })).toEqual({
      ok: false,
      error: 'Invoice carried no payment hash',
    })
    expect(parseNwcInvoice(null).ok).toBe(false)
  })
})

describe('parseNwcLookup', () => {
  it('reads a paid invoice with its preimage and settlement time', () => {
    const result = parseNwcLookup({
      state: 'paid',
      amount: 5_000_000,
      preimage: 'B'.repeat(64),
      settled_at: 1_760_000_000,
    })
    expect(result).toEqual({
      ok: true,
      status: { state: 'paid', amountPaidMsat: 5_000_000, preimage: 'b'.repeat(64), settledAt: 1_760_000_000 },
    })
  })

  it('keeps pending pending and reports no paid amount', () => {
    const result = parseNwcLookup({ state: 'pending', amount: 5_000_000 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.status.state).toBe('pending')
      expect(result.status.amountPaidMsat).toBeNull()
      expect(result.status.settledAt).toBeNull()
    }
  })

  it('never upgrades an unrecognised state to paid', () => {
    expect(parseNwcLookup({ state: 'mystery' })).toEqual({
      ok: false,
      error: 'Wallet returned an unrecognised invoice state',
    })
    expect(parseNwcLookup(null).ok).toBe(false)
  })

  it('accepts a decrypted paid response through the event path', () => {
    const event = {
      kind: 23195,
      pubkey: WALLET_PUBKEY,
      content: content({ result: { state: 'paid', amount: 5_000_000, preimage: 'C'.repeat(64) }, error: null }),
    }
    const result = parseNwcLookup(
      (() => {
        const decrypted = nip04.decrypt(CLIENT_SECRET, WALLET_PUBKEY, event.content)
        return JSON.parse(decrypted).result
      })(),
    )
    expect(result.ok && result.status.preimage).toBe('c'.repeat(64))
  })
})
