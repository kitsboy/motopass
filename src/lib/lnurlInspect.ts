import { bech32Decode, wordsToBytes } from './bech32'
import { decodeBolt11, type Bolt11Invoice } from './bolt11'
import {
  parseLightningAddress,
  requestInvoice,
  resolveLnurlPay,
  resolveLnurlPayUrl,
  type FetchLike,
  type LnurlPayParams,
} from './lnurl'

/**
 * LNURL-pay / Lightning Address inspector.
 *
 * Parsing (address shape, LNURL bech32, metadata) is local. Resolving the
 * endpoint is a network request made only when the visitor asks for it; a
 * browser CORS refusal is surfaced as a refusal, not papered over. The invoice
 * returned by the callback is decoded and amount-checked locally.
 */

export type LnurlTarget =
  | { kind: 'address'; input: string; endpoint: string }
  | { kind: 'lnurl'; input: string; endpoint: string }

export type LnurlTargetResult = { ok: true; target: LnurlTarget } | { ok: false; error: string }

export interface LnurlMetadataEntry {
  type: string
  value: string
}

function decodeLnurl(raw: string): string | null {
  const normalized = raw.trim().replace(/^lightning:/i, '').replace(/\s+/g, '')
  if (!/^lnurl1/i.test(normalized)) return null
  const decoded = bech32Decode(normalized, { checksum: true, encoding: 'bech32' })
  if (!decoded.ok) return null
  const bytes = wordsToBytes(decoded.words)
  if (!bytes) return null
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

function isHttps(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
  } catch {
    return false
  }
}

export function parseLnurlTarget(input: string): LnurlTargetResult {
  const raw = input.trim().replace(/^lightning:/i, '')
  if (!raw) return { ok: false, error: 'Paste a Lightning Address or LNURL first' }

  const address = parseLightningAddress(raw)
  if (address) {
    return {
      ok: true,
      target: {
        kind: 'address',
        input: raw,
        endpoint: `https://${address.domain}/.well-known/lnurlp/${encodeURIComponent(address.user)}`,
      },
    }
  }

  const decoded = decodeLnurl(raw)
  if (decoded != null) {
    if (!isHttps(decoded)) return { ok: false, error: 'LNURL decoded to a non-https URL; refusing to open it' }
    return { ok: true, target: { kind: 'lnurl', input: raw, endpoint: decoded } }
  }

  if (/^lnurl1/i.test(raw)) return { ok: false, error: 'LNURL bech32 could not be decoded' }
  return { ok: false, error: 'Not a Lightning Address (user@domain) or an lnurl1… string' }
}

export function parseMetadata(metadata: string): LnurlMetadataEntry[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(metadata)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.flatMap(entry => {
    if (!Array.isArray(entry) || entry.length < 2) return []
    const [type, value] = entry
    return typeof type === 'string' && typeof value === 'string' ? [{ type, value }] : []
  })
}

export interface LnurlInspection {
  target: LnurlTarget
  params: LnurlPayParams
  metadata: LnurlMetadataEntry[]
}

export type LnurlInspectionResult =
  | { ok: true; inspection: LnurlInspection }
  | { ok: false; error: string }

export async function inspectLnurlPay(input: string, fetchImpl: FetchLike = fetch): Promise<LnurlInspectionResult> {
  const parsed = parseLnurlTarget(input)
  if (!parsed.ok) return parsed
  const result =
    parsed.target.kind === 'address'
      ? await resolveLnurlPay(parsed.target.input, fetchImpl)
      : await resolveLnurlPayUrl(parsed.target.endpoint, fetchImpl)
  if (!result.ok) return result
  return {
    ok: true,
    inspection: {
      target: parsed.target,
      params: result.params,
      metadata: parseMetadata(result.params.metadata),
    },
  }
}

export interface LnurlInvoiceInspection {
  invoice: string
  decoded: Bolt11Invoice
  paymentHashMatchesAmount: boolean
}

export type LnurlInvoiceResult =
  | { ok: true; result: LnurlInvoiceInspection }
  | { ok: false; error: string }

export async function requestAndInspectLnurlInvoice(
  input: string,
  sats: number,
  fetchImpl: FetchLike = fetch,
): Promise<LnurlInvoiceResult> {
  const inspected = await inspectLnurlPay(input, fetchImpl)
  if (!inspected.ok) return inspected
  const { params } = inspected.inspection
  const requested = await requestInvoice(params, sats, fetchImpl)
  if (!requested.ok) return requested
  const decoded = decodeBolt11(requested.invoice)
  if (!decoded.ok) return { ok: false, error: decoded.error }
  return {
    ok: true,
    result: {
      invoice: requested.invoice,
      decoded: decoded.invoice,
      paymentHashMatchesAmount: decoded.invoice.amountMsat === sats * 1000,
    },
  }
}

export function invoiceShortHash(invoice: Bolt11Invoice): string {
  return invoice.paymentHash ? `${invoice.paymentHash.slice(0, 16)}…` : 'no payment hash'
}

export function lnurlEndpointLabel(target: LnurlTarget): string {
  return `${target.kind} · ${new URL(target.endpoint).host}`
}
