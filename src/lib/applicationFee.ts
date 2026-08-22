/**
 * MotoPass application-fee commerce client (Ziggy, 2026-08-22)
 *
 * Talks to the Satohash API's real application-fee rail:
 *   GET  /api/public/motopass/fee      → fee config (sats, BTC-first)
 *   POST /api/public/motopass/invoice  → real BOLT11 on the MotoPass wallet
 *   GET  /api/public/motopass/status/:hash → settlement poll
 *
 * Zero-knowledge: the invoice is keyed ONLY by payment_hash. We send the
 * applicant's canonical application hash (not identity) so the receipt memo
 * ties the fee to the application without ever storing a name/email/npub.
 * No wallet key ever leaves the server.
 *
 * Never throws — surfaces { ok:false, error } for honest UI.
 */
import { SATOHASH_API_BASE } from './satohash'

export type ApplicationFeeConfig = {
  ok: boolean
  sats?: number
  configured?: boolean
  rail?: string
  note?: string
  error?: string
}

export type ApplicationFeeInvoice = {
  ok: boolean
  payment_request?: string
  payment_hash?: string
  amount_sats?: number
  provider?: string
  mock?: boolean
  memo?: string
  expires_in?: number
  note?: string
  error?: string
  httpStatus?: number
}

export type ApplicationFeeStatus = {
  ok: boolean
  paid?: boolean
  status?: string
  amount_msat?: number | null
  error?: string
}

/** GET fee config — how much is the application fee, in sats (BTC-first). */
export async function fetchApplicationFeeConfig(): Promise<ApplicationFeeConfig> {
  try {
    const res = await fetch(`${SATOHASH_API_BASE}/api/public/motopass/fee`, {
      headers: { 'X-Satohash-Client': 'motopass' },
      cache: 'no-store',
    })
    if (!res.ok) {
      return { ok: false, error: `Fee config unavailable (HTTP ${res.status})` }
    }
    const data = (await res.json()) as Record<string, unknown>
    return {
      ok: true,
      sats: typeof data.sats === 'number' ? data.sats : undefined,
      configured: typeof data.configured === 'boolean' ? data.configured : undefined,
      rail: typeof data.rail === 'string' ? data.rail : undefined,
      note: typeof data.note === 'string' ? data.note : undefined,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Fee rail unreachable' }
  }
}

/**
 * Create a REAL BOLT11 invoice for the application fee.
 * @param appHash 64-hex canonical hash of the application (zero-knowledge ref, not identity)
 */
export async function createApplicationFeeInvoice(appHash: string): Promise<ApplicationFeeInvoice> {
  try {
    const res = await fetch(`${SATOHASH_API_BASE}/api/public/motopass/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Satohash-Client': 'motopass' },
      body: JSON.stringify({ appHash: appHash.toLowerCase() }),
    })
    const data = (await res.json()) as Record<string, unknown>
    if (!res.ok) {
      return {
        ok: false,
        httpStatus: res.status,
        error: typeof data.error === 'string' ? data.error : `Invoice failed (HTTP ${res.status})`,
      }
    }
    return {
      ok: true,
      payment_request: typeof data.payment_request === 'string' ? data.payment_request : undefined,
      payment_hash: typeof data.payment_hash === 'string' ? data.payment_hash : undefined,
      amount_sats: typeof data.amount_sats === 'number' ? data.amount_sats : undefined,
      provider: typeof data.provider === 'string' ? data.provider : undefined,
      mock: data.mock === true,
      memo: typeof data.memo === 'string' ? data.memo : undefined,
      expires_in: typeof data.expires_in === 'number' ? data.expires_in : undefined,
      note: typeof data.note === 'string' ? data.note : undefined,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invoice rail unreachable' }
  }
}

/** GET settlement status for an application-fee invoice. */
export async function fetchApplicationFeeStatus(paymentHash: string): Promise<ApplicationFeeStatus> {
  try {
    const res = await fetch(
      `${SATOHASH_API_BASE}/api/public/motopass/status/${encodeURIComponent(paymentHash)}`,
      { headers: { 'X-Satohash-Client': 'motopass' }, cache: 'no-store' },
    )
    if (!res.ok) {
      return { ok: false, error: `Status check failed (HTTP ${res.status})` }
    }
    const data = (await res.json()) as Record<string, unknown>
    return {
      ok: true,
      paid: data.paid === true,
      status: typeof data.status === 'string' ? data.status : undefined,
      amount_msat: typeof data.amount_msat === 'number' ? data.amount_msat : null,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Status rail unreachable' }
  }
}
