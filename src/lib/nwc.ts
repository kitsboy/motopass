import { SimplePool, type Event, type Filter } from 'nostr-tools'
import * as nip04 from 'nostr-tools/nip04'
import { finalizeEvent, getPublicKey, type EventTemplate } from 'nostr-tools/pure'

/**
 * NIP-47 (Nostr Wallet Connect), read-only.
 *
 * The connection string carries a secret with whatever permissions the wallet
 * granted. This client only ever sends `get_balance`, keeps the secret in
 * sessionStorage, and never asks for an invoice, a payment or a signature. A
 * wallet that requires a per-request budget still sees a request from us; the
 * UI says so plainly instead of implying the connection is powerless.
 */

const HEX64 = /^[a-f0-9]{64}$/i
const NWC_PREFIX = 'nostr+walletconnect://'

export interface NwcConnection {
  walletPubkey: string
  relayUrl: string
  secret: string
}

export type NwcBalanceResult =
  | { ok: true; balanceMsat: number; balanceSats: number }
  | { ok: false; error: string }

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export function parseNwcUri(raw: string): NwcConnection | null {
  const input = raw.trim()
  if (!input.toLowerCase().startsWith(NWC_PREFIX)) return null
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }
  const walletPubkey = url.hostname.toLowerCase()
  const relay = url.searchParams.get('relay')?.trim() ?? ''
  const secret = url.searchParams.get('secret')?.trim().toLowerCase() ?? ''
  if (!HEX64.test(walletPubkey) || !HEX64.test(secret)) return null
  let relayUrl: URL
  try {
    relayUrl = new URL(relay)
  } catch {
    return null
  }
  if (relayUrl.protocol !== 'wss:' || relayUrl.username || relayUrl.password) return null
  return { walletPubkey, relayUrl: relayUrl.toString(), secret }
}

/** Build and sign a NIP-47 request with the client key. */
export function buildNwcRequest(
  secret: Uint8Array,
  walletPubkey: string,
  method: string,
  params: Record<string, unknown> = {},
  now: number = Math.floor(Date.now() / 1000),
): Event {
  const template: EventTemplate = {
    kind: 23194,
    created_at: now,
    tags: [['p', walletPubkey]],
    content: nip04.encrypt(secret, walletPubkey, JSON.stringify({ method, params })),
  }
  return finalizeEvent(template, secret)
}

/** Decrypt a NIP-47 response. Wrong author, wrong key or junk is an error. */
export function parseNwcResponse(
  secret: Uint8Array,
  walletPubkey: string,
  event: Pick<Event, 'kind' | 'pubkey' | 'content'>,
): NwcBalanceResult | { ok: false; error: string; method?: string } {
  if (event.kind !== 23195) return { ok: false, error: 'Not a NIP-47 response' }
  if (event.pubkey.toLowerCase() !== walletPubkey.toLowerCase()) {
    return { ok: false, error: 'Response is not from the connected wallet' }
  }
  let payload: unknown
  try {
    payload = JSON.parse(nip04.decrypt(secret, walletPubkey, event.content))
  } catch {
    return { ok: false, error: 'Response could not be decrypted' }
  }
  if (!payload || typeof payload !== 'object') return { ok: false, error: 'Empty wallet response' }
  const data = payload as { result?: unknown; error?: { code?: unknown; message?: unknown } | null }
  if (data.error) {
    const code = typeof data.error.code === 'string' ? data.error.code : 'ERROR'
    const message = typeof data.error.message === 'string' ? data.error.message : 'Wallet refused the request'
    return { ok: false, error: `${code}: ${message}` }
  }
  const result = data.result as { balance?: unknown } | null | undefined
  const balanceMsat = result?.balance
  if (typeof balanceMsat !== 'number' || !Number.isFinite(balanceMsat) || balanceMsat < 0) {
    return { ok: false, error: 'Response carried no balance' }
  }
  return {
    ok: true,
    balanceMsat,
    balanceSats: Math.floor(balanceMsat / 1000),
  }
}

/**
 * Ask the wallet for its balance and wait for one matching response.
 * Never throws; every failure path returns `{ ok: false, error }`.
 */
export async function nwcGetBalance(
  uri: string,
  opts: { timeoutMs?: number } = {},
): Promise<NwcBalanceResult> {
  const connection = parseNwcUri(uri)
  if (!connection) return { ok: false, error: 'Not a valid NWC connection string' }
  const secret = hexToBytes(connection.secret)
  const clientPubkey = getPublicKey(secret)

  let request: Event
  try {
    request = buildNwcRequest(secret, connection.walletPubkey, 'get_balance')
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not build request' }
  }

  const timeoutMs = opts.timeoutMs ?? 15_000
  const pool = new SimplePool()

  return await new Promise<NwcBalanceResult>(resolve => {
    let settled = false
    let sub: { close: () => void } | undefined

    const finish = (result: NwcBalanceResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        sub?.close()
      } catch {
        /* already closed */
      }
      try {
        pool.destroy()
      } catch {
        /* pool already gone */
      }
      resolve(result)
    }

    const timer = setTimeout(
      () => finish({ ok: false, error: `Wallet did not answer within ${Math.round(timeoutMs / 1000)}s` }),
      timeoutMs,
    )

    try {
      const filter: Filter = {
        kinds: [23195],
        authors: [connection.walletPubkey],
        '#e': [request.id],
        '#p': [clientPubkey],
        since: request.created_at - 60,
      }
      sub = pool.subscribeMany(
        [connection.relayUrl],
        filter,
        {
          onevent(event) {
            finish(parseNwcResponse(secret, connection.walletPubkey, event))
          },
        },
      )
    } catch (err) {
      finish({ ok: false, error: err instanceof Error ? err.message : 'Relay connection failed' })
    }
  })
}
