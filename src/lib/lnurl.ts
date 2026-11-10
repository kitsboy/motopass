/**
 * LNURL-pay (LUD-16 Lightning Address) client.
 *
 * Pure functions over an injected fetch: address parsing, amount clamping and
 * invoice checks are all testable without a node. The only network call goes to
 * an https URL derived from a validated address, and a response is refused
 * unless it is a payRequest with a sane msat range and an https callback.
 */

export interface LightningAddress {
  user: string
  domain: string
}

const USER_RE = /^[a-z0-9._+-]{1,64}$/i
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

/** Minimal fetch surface so tests can inject a fake. */
export type FetchLike = (url: string) => Promise<{
  ok: boolean
  status?: number
  json: () => Promise<unknown>
}>

/** `user@domain` only — no scheme, path, port or whitespace. */
export function parseLightningAddress(input: string): LightningAddress | null {
  const raw = input.trim()
  if (!raw || raw.includes('://') || raw.includes('/') || /\s/.test(raw)) return null
  const at = raw.lastIndexOf('@')
  if (at <= 0 || at === raw.length - 1) return null
  const user = raw.slice(0, at)
  const domain = raw.slice(at + 1)
  if (!USER_RE.test(user) || !DOMAIN_RE.test(domain)) return null
  return { user, domain: domain.toLowerCase() }
}

export function formatLightningAddress(address: LightningAddress): string {
  return `${address.user}@${address.domain}`
}

/** LUD-16 well-known URL, or null when the address is not one we accept. */
export function lnurlpUrl(input: string | LightningAddress): string | null {
  const address = typeof input === 'string' ? parseLightningAddress(input) : input
  if (!address) return null
  return `https://${address.domain}/.well-known/lnurlp/${encodeURIComponent(address.user)}`
}

export interface LnurlPayParams {
  callback: string
  /** msat, as the protocol specifies */
  minSendable: number
  maxSendable: number
  metadata: string
  commentAllowed: number
}

export type LnurlResolveResult = { ok: true; params: LnurlPayParams } | { ok: false; error: string }

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
  } catch {
    return false
  }
}

function positiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

/**
 * GET the .well-known endpoint and accept only a payRequest we can pay.
 * Never throws: every failure comes back as `{ ok: false, error }`.
 */
export async function resolveLnurlPay(
  address: string | LightningAddress,
  fetchImpl: FetchLike = fetch,
): Promise<LnurlResolveResult> {
  const url = lnurlpUrl(address)
  if (!url) return { ok: false, error: 'Not a Lightning Address' }
  return resolveLnurlPayUrl(url, fetchImpl)
}

/** Resolve an already-validated https LNURL-pay endpoint. */
export async function resolveLnurlPayUrl(
  endpoint: string,
  fetchImpl: FetchLike = fetch,
): Promise<LnurlResolveResult> {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return { ok: false, error: 'LNURL endpoint is malformed' }
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    return { ok: false, error: 'LNURL endpoint must be an https URL without credentials' }
  }

  let body: unknown
  try {
    const res = await fetchImpl(url.toString())
    if (!res.ok) return { ok: false, error: `Lightning Address returned HTTP ${res.status ?? 'error'}` }
    body = await res.json()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Lightning Address unreachable' }
  }

  if (!body || typeof body !== 'object') return { ok: false, error: 'Empty LNURL response' }
  const data = body as Record<string, unknown>
  if (data.tag !== 'payRequest') return { ok: false, error: 'Endpoint is not an LNURL-pay request' }
  if (!isHttpsUrl(data.callback)) return { ok: false, error: 'Invoice callback is not an https URL' }

  const minSendable = positiveInt(data.minSendable)
  const maxSendable = positiveInt(data.maxSendable)
  if (minSendable == null || maxSendable == null) return { ok: false, error: 'LNURL range is missing' }
  if (maxSendable < minSendable) return { ok: false, error: 'LNURL range is inverted' }
  if (typeof data.metadata !== 'string') return { ok: false, error: 'LNURL metadata is missing' }

  const commentAllowed =
    typeof data.commentAllowed === 'number' && Number.isInteger(data.commentAllowed) && data.commentAllowed > 0
      ? data.commentAllowed
      : 0

  return {
    ok: true,
    params: {
      callback: data.callback,
      minSendable,
      maxSendable,
      metadata: data.metadata,
      commentAllowed,
    },
  }
}

export function satsToMsat(sats: number): number | null {
  if (!Number.isFinite(sats) || sats <= 0) return null
  const whole = Math.round(sats)
  if (whole <= 0) return null
  return whole * 1000
}

/** Clamp a requested amount into the server's range, or null when impossible. */
export function clampAmountSats(sats: number, params: Pick<LnurlPayParams, 'minSendable' | 'maxSendable'>): number | null {
  const want = satsToMsat(sats)
  if (want == null) return null
  if (params.maxSendable < params.minSendable) return null
  const clamped = Math.min(Math.max(want, params.minSendable), params.maxSendable)
  const whole = Math.floor(clamped / 1000)
  return whole > 0 ? whole : null
}

export type LnurlInvoiceResult =
  | { ok: true; invoice: string; sats: number }
  | { ok: false; error: string }

/** BOLT11 human-readable prefix check — we never display a non-invoice string as payable. */
export function looksLikeBolt11(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (trimmed.length < 100) return false
  return /^ln(bc|tb|bcrt)[0-9a-z]*1[0-9a-z]+$/i.test(trimmed)
}

/**
 * Ask the callback for an invoice at `sats`. The comment (when the server
 * allows one) names the gap being funded; it is never a promise of outcome.
 */
export async function requestInvoice(
  params: LnurlPayParams,
  sats: number,
  fetchImpl: FetchLike = fetch,
  comment?: string,
): Promise<LnurlInvoiceResult> {
  const amountSats = clampAmountSats(sats, params)
  if (amountSats == null) return { ok: false, error: 'Amount is outside the invoice range' }
  if (!isHttpsUrl(params.callback)) return { ok: false, error: 'Invoice callback is not https' }

  let url: URL
  try {
    url = new URL(params.callback)
  } catch {
    return { ok: false, error: 'Invoice callback is malformed' }
  }
  url.searchParams.set('amount', String(amountSats * 1000))
  const note = comment?.trim()
  if (note && params.commentAllowed > 0) {
    url.searchParams.set('comment', note.slice(0, params.commentAllowed))
  }

  let body: unknown
  try {
    const res = await fetchImpl(url.toString())
    if (!res.ok) return { ok: false, error: `Invoice request returned HTTP ${res.status ?? 'error'}` }
    body = await res.json()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invoice request failed' }
  }

  const pr = body && typeof body === 'object' ? (body as Record<string, unknown>).pr : undefined
  if (typeof pr === 'string' && /reason|error/i.test(pr)) {
    return { ok: false, error: pr }
  }
  if (!looksLikeBolt11(pr)) return { ok: false, error: 'Server did not return a BOLT11 invoice' }
  return { ok: true, invoice: pr.trim(), sats: amountSats }
}

/**
 * Fallback when LNURL resolution fails: a wallet-native URI. The wallet does
 * its own resolution, so failure here is handed off, not hidden.
 */
export function lightningDeepLink(address: string, sats?: number): string | null {
  const parsed = parseLightningAddress(address)
  if (!parsed) return null
  const msat = sats != null ? satsToMsat(sats) : null
  const base = `lightning:${formatLightningAddress(parsed)}`
  return msat != null ? `${base}?amount=${msat}` : base
}
