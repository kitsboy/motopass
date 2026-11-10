import { SimplePool, type Event, type Filter } from 'nostr-tools'
import * as nip04 from 'nostr-tools/nip04'
import { finalizeEvent, getPublicKey, type EventTemplate } from 'nostr-tools/pure'
import { looksLikeBolt11 } from './lnurl'

/**
 * NIP-47 (Nostr Wallet Connect).
 *
 * The connection string carries a secret with whatever permissions the wallet
 * granted. This client sends exactly four methods — `get_balance`,
 * `make_invoice`, `lookup_invoice` and `list_transactions` — and never asks for
 * a payment or a signature. A wallet that requires a per-request budget still
 * sees a request from us; the UI says so plainly instead of implying the
 * connection is powerless.
 *
 * Settlement is only ever read from the user's own wallet. There is no
 * MotoPass node watching the payment, so an invoice is never marked paid
 * because a page was open.
 */

const HEX64 = /^[a-f0-9]{64}$/i
const NWC_PREFIX = 'nostr+walletconnect://'

/** sessionStorage key shared with the portfolio wallet card. */
export const NWC_STORAGE_KEY = 'motopass-nwc-uri'

export interface NwcConnection {
  walletPubkey: string
  relayUrl: string
  secret: string
}

export type NwcBalanceResult =
  | { ok: true; balanceMsat: number; balanceSats: number }
  | { ok: false; error: string }

export type NwcResult = { ok: true; result: unknown } | { ok: false; error: string }

export interface NwcInvoice {
  bolt11: string
  paymentHash: string
  /** Wallet-reported amount in msat, when it reports one. */
  amountMsat: number | null
}

export type NwcInvoiceState = 'paid' | 'pending' | 'expired' | 'failed' | 'unknown'

export interface NwcInvoiceStatus {
  state: NwcInvoiceState
  amountPaidMsat: number | null
  preimage: string | null
  /** Unix seconds, only when the wallet reports a settlement time. */
  settledAt: number | null
}

export type NwcTxState = 'settled' | 'pending' | 'expired' | 'failed' | 'unknown'

/**
 * One row from `list_transactions`. Every field is exactly what the wallet
 * reported: a missing field stays null rather than being filled in.
 */
export interface NwcTransaction {
  type: 'incoming' | 'outgoing'
  description: string | null
  paymentHash: string | null
  preimage: string | null
  amountMsat: number | null
  /** Wallet-reported fee, outgoing only. Null when it reports none. */
  feesPaidMsat: number | null
  createdAt: number | null
  settledAt: number | null
  state: NwcTxState
}

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
export function decryptNwcResponse(
  secret: Uint8Array,
  walletPubkey: string,
  event: Pick<Event, 'kind' | 'pubkey' | 'content'>,
): NwcResult {
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
  return { ok: true, result: data.result }
}

/** Balance payload from a decrypted `get_balance` result. */
export function parseNwcBalance(result: unknown): NwcBalanceResult {
  const data = result as { balance?: unknown } | null | undefined
  const balanceMsat = data?.balance
  if (typeof balanceMsat !== 'number' || !Number.isFinite(balanceMsat) || balanceMsat < 0) {
    return { ok: false, error: 'Response carried no balance' }
  }
  return {
    ok: true,
    balanceMsat,
    balanceSats: Math.floor(balanceMsat / 1000),
  }
}

/** Backwards-compatible balance parse straight from a response event. */
export function parseNwcResponse(
  secret: Uint8Array,
  walletPubkey: string,
  event: Pick<Event, 'kind' | 'pubkey' | 'content'>,
): NwcBalanceResult {
  const decrypted = decryptNwcResponse(secret, walletPubkey, event)
  if (!decrypted.ok) return { ok: false, error: decrypted.error }
  return parseNwcBalance(decrypted.result)
}

/** A `make_invoice` result is payable only if it is a BOLT11 with a payment hash. */
export function parseNwcInvoice(result: unknown): { ok: true; invoice: NwcInvoice } | { ok: false; error: string } {
  const data = result as Record<string, unknown> | null | undefined
  const bolt11 = data?.invoice
  const paymentHash = typeof data?.payment_hash === 'string' ? data.payment_hash.trim().toLowerCase() : ''
  if (!looksLikeBolt11(bolt11)) return { ok: false, error: 'Wallet did not return a BOLT11 invoice' }
  if (!HEX64.test(paymentHash)) return { ok: false, error: 'Invoice carried no payment hash' }
  const amountMsat = typeof data?.amount === 'number' && Number.isFinite(data.amount) && data.amount > 0 ? data.amount : null
  return { ok: true, invoice: { bolt11: bolt11.trim(), paymentHash, amountMsat } }
}

function normaliseState(value: unknown): NwcInvoiceState {
  const state = typeof value === 'string' ? value.toLowerCase() : ''
  if (state === 'paid' || state === 'settled' || state === 'complete' || state === 'completed') return 'paid'
  if (state === 'pending' || state === 'open' || state === 'unpaid') return 'pending'
  if (state === 'expired') return 'expired'
  if (state === 'failed' || state === 'error') return 'failed'
  return 'unknown'
}

/** A `lookup_invoice` result. Any state we do not recognise is `unknown`, not paid. */
export function parseNwcLookup(result: unknown): { ok: true; status: NwcInvoiceStatus } | { ok: false; error: string } {
  const data = result as Record<string, unknown> | null | undefined
  if (!data || typeof data !== 'object') return { ok: false, error: 'Wallet returned no invoice state' }
  const state = normaliseState(data.state ?? data.status)
  if (state === 'unknown') return { ok: false, error: 'Wallet returned an unrecognised invoice state' }
  const preimage = typeof data.preimage === 'string' && HEX64.test(data.preimage) ? data.preimage.toLowerCase() : null
  const amount = typeof data.amount === 'number' && Number.isFinite(data.amount) && data.amount >= 0 ? data.amount : null
  const settledRaw = data.settled_at ?? data.paid_at
  const settledAt =
    typeof settledRaw === 'number' && Number.isFinite(settledRaw) && settledRaw > 0 ? Math.floor(settledRaw) : null
  return {
    ok: true,
    status: { state, amountPaidMsat: state === 'paid' ? amount : null, preimage, settledAt },
  }
}

/** `list_transactions` says `settled` where `lookup_invoice` says `paid`. */
function txState(state: NwcInvoiceState): NwcTxState {
  return state === 'paid' ? 'settled' : state
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function unixOrNull(value: unknown): number | null {
  const seconds = numberOrNull(value)
  return seconds != null && seconds > 0 ? Math.floor(seconds) : null
}

/**
 * A `list_transactions` result. Rows the wallet reports in a shape we cannot
 * read are dropped; if every row was unreadable the call is an error, so an
 * empty list always means "the wallet says there is nothing", never "we could
 * not parse what it sent".
 */
export function parseNwcTransactions(
  result: unknown,
): { ok: true; transactions: NwcTransaction[] } | { ok: false; error: string } {
  const rows = Array.isArray(result)
    ? result
    : result && typeof result === 'object' && Array.isArray((result as { transactions?: unknown }).transactions)
      ? ((result as { transactions: unknown[] }).transactions)
      : null
  if (!rows) return { ok: false, error: 'Wallet returned no transaction list' }

  const transactions: NwcTransaction[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const data = row as Record<string, unknown>
    const type = data.type === 'incoming' || data.type === 'outgoing' ? data.type : null
    if (!type) continue
    const paymentHash =
      typeof data.payment_hash === 'string' && HEX64.test(data.payment_hash.trim())
        ? data.payment_hash.trim().toLowerCase()
        : null
    const preimage =
      typeof data.preimage === 'string' && HEX64.test(data.preimage.trim()) ? data.preimage.trim().toLowerCase() : null
    const description =
      typeof data.description === 'string' && data.description.trim() ? data.description.trim().slice(0, 200) : null
    transactions.push({
      type,
      description,
      paymentHash,
      preimage,
      amountMsat: numberOrNull(data.amount),
      feesPaidMsat: numberOrNull(data.fees_paid),
      createdAt: unixOrNull(data.created_at),
      settledAt: unixOrNull(data.settled_at ?? data.paid_at),
      state: txState(normaliseState(data.state ?? data.status)),
    })
  }

  if (rows.length > 0 && transactions.length === 0) {
    return { ok: false, error: 'Wallet returned transactions in a shape we cannot read' }
  }

  transactions.sort((a, b) => (b.settledAt ?? b.createdAt ?? 0) - (a.settledAt ?? a.createdAt ?? 0))
  return { ok: true, transactions }
}

/**
 * Send one NIP-47 request and wait for its matching response.
 * Never throws; every failure path returns `{ ok: false, error }`.
 */
export async function nwcRequest(
  uri: string,
  method: string,
  params: Record<string, unknown> = {},
  opts: { timeoutMs?: number } = {},
): Promise<NwcResult> {
  const connection = parseNwcUri(uri)
  if (!connection) return { ok: false, error: 'Not a valid NWC connection string' }
  const secret = hexToBytes(connection.secret)
  const clientPubkey = getPublicKey(secret)

  let request: Event
  try {
    request = buildNwcRequest(secret, connection.walletPubkey, method, params)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not build request' }
  }

  const timeoutMs = opts.timeoutMs ?? 15_000
  const pool = new SimplePool()

  return await new Promise<NwcResult>(resolve => {
    let settled = false
    let sub: { close: () => void } | undefined

    const finish = (result: NwcResult) => {
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
            finish(decryptNwcResponse(secret, connection.walletPubkey, event))
          },
        },
      )
    } catch (err) {
      finish({ ok: false, error: err instanceof Error ? err.message : 'Relay connection failed' })
    }
  })
}

/** Ask the wallet for its balance. */
export async function nwcGetBalance(
  uri: string,
  opts: { timeoutMs?: number } = {},
): Promise<NwcBalanceResult> {
  const response = await nwcRequest(uri, 'get_balance', {}, opts)
  if (!response.ok) return response
  return parseNwcBalance(response.result)
}

/**
 * Ask the user's wallet to issue an invoice for a gap tip.
 * The memo names the gap; it is not a promise that the fact will be filled.
 */
export async function nwcMakeInvoice(
  uri: string,
  args: { sats: number; memo: string },
  opts: { timeoutMs?: number } = {},
): Promise<{ ok: true; invoice: NwcInvoice } | { ok: false; error: string }> {
  if (!Number.isInteger(args.sats) || args.sats <= 0) return { ok: false, error: 'Amount must be whole sats' }
  const response = await nwcRequest(
    uri,
    'make_invoice',
    { amount: args.sats * 1000, description: args.memo.slice(0, 200) },
    opts,
  )
  if (!response.ok) return response
  return parseNwcInvoice(response.result)
}

/**
 * Ask the wallet for its recent transactions. This is the wallet's own record,
 * not a MotoPass ledger: it can contain payments unrelated to any gap tip, and
 * only the wallet decides which ones it reports.
 */
export async function nwcListTransactions(
  uri: string,
  opts: { limit?: number; timeoutMs?: number } = {},
): Promise<{ ok: true; transactions: NwcTransaction[] } | { ok: false; error: string }> {
  const requested = numberOrNull(opts.limit) ?? 10
  const limit = Math.min(50, Math.max(1, Math.floor(requested)))
  const response = await nwcRequest(uri, 'list_transactions', { limit }, { timeoutMs: opts.timeoutMs })
  if (!response.ok) return response
  return parseNwcTransactions(response.result)
}

/** Ask the wallet what happened to an invoice it issued. */
export async function nwcLookupInvoice(
  uri: string,
  paymentHash: string,
  opts: { timeoutMs?: number } = {},
): Promise<{ ok: true; status: NwcInvoiceStatus } | { ok: false; error: string }> {
  const hash = paymentHash.trim().toLowerCase()
  if (!HEX64.test(hash)) return { ok: false, error: 'Not a payment hash' }
  const response = await nwcRequest(uri, 'lookup_invoice', { payment_hash: hash }, opts)
  if (!response.ok) return response
  return parseNwcLookup(response.result)
}
