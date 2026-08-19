import { isAllowedSatohashUrl, normalizeSha256, sanitizeStampId } from './timestampSecurity'

const SATOHASH_BASE = import.meta.env.VITE_SATOHASH_URL || 'https://satohash.io'

/** Public Satohash API base (family timestamp backbone). May be offline until API is deployed. */
export const SATOHASH_API_BASE =
  import.meta.env.VITE_SATOHASH_API_URL || 'https://api.satohash.io'

const CLIENT_HEADER = 'motopass'

export type SatohashHealthResult = {
  ok: boolean
  status?: number
  data?: unknown
  error?: string
}

export type SatohashStampResult = {
  ok: boolean
  id?: string
  status?: string
  hash?: string
  error?: string
  httpStatus?: number
}

export type SatohashGetStampResult = {
  ok: boolean
  id?: string
  status?: string
  hash?: string
  filename?: string
  bitcoin_block_height?: number | null
  created_at?: string
  confirmed_at?: string | null
  error?: string
  httpStatus?: number
  data?: unknown
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function satohashOrigin(): string {
  return SATOHASH_BASE.replace(/\/$/, '')
}

/** Allowlisted verify URL, or empty string if hash/origin is unsafe. */
export function satohashVerifyUrl(hash: string): string {
  const h = normalizeSha256(hash)
  if (!h) return ''
  const url = `${satohashOrigin()}/verify/${h}`
  return isAllowedSatohashUrl(url) ? url : ''
}

/** Deep-link to Satohash stamp UI when the API is unreachable (browser fallback). */
export function satohashStampGuideUrl(hash: string): string {
  const h = normalizeSha256(hash)
  if (!h) return ''
  const url = `${satohashOrigin()}/stamp?hash=${h}`
  return isAllowedSatohashUrl(url) ? url : ''
}

/** Verify URL for a server-issued proof id (preferred when API stamp succeeds). */
export function satohashProofVerifyUrl(id: string): string {
  const safe = sanitizeStampId(id)
  if (!safe) return ''
  const url = `${satohashOrigin()}/verify/${encodeURIComponent(safe)}`
  return isAllowedSatohashUrl(url) ? url : ''
}

/** Render `href` only for allowlisted Satohash URLs. */
export function safeSatohashHref(url: string | undefined): string | undefined {
  if (!url || !isAllowedSatohashUrl(url)) return undefined
  return url
}

export async function hashApplicationPayload(payload: Record<string, unknown>): Promise<string> {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort())
  return sha256Hex(canonical)
}

export async function fetchBitcoinBlockHeight(): Promise<number | null> {
  try {
    const res = await fetch('https://mempool.space/api/blocks/tip/height')
    if (!res.ok) return null
    return Number(await res.text())
  } catch {
    return null
  }
}

function isHex64(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash)
}

function stampHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Satohash-Client': CLIENT_HEADER,
  }
  if (apiKey) headers['X-Satohash-Key'] = apiKey
  return headers
}

/**
 * GET /health — family API liveness. Never throws; returns ok:false when unreachable.
 */
export async function getApiHealth(): Promise<SatohashHealthResult> {
  try {
    const res = await fetch(`${SATOHASH_API_BASE}/health`, {
      method: 'GET',
      headers: { 'X-Satohash-Client': CLIENT_HEADER },
    })
    let data: unknown
    try {
      data = await res.json()
    } catch {
      data = undefined
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: `Satohash API health returned HTTP ${res.status}`,
      }
    }
    return { ok: true, status: res.status, data }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Satohash API unreachable',
    }
  }
}

/**
 * POST /api/stamp — submit a SHA-256 hex hash for OpenTimestamps anchoring.
 * Graceful offline: returns ok:false (does not throw) when the API is down.
 */
export async function stampHash(
  hash: string,
  opts?: { filename?: string; apiKey?: string },
): Promise<SatohashStampResult> {
  const normalized = hash.trim().toLowerCase()
  if (!isHex64(normalized)) {
    return { ok: false, error: 'Hash must be 64 hex characters (SHA-256)' }
  }

  try {
    const res = await fetch(`${SATOHASH_API_BASE}/api/stamp`, {
      method: 'POST',
      headers: stampHeaders(opts?.apiKey),
      body: JSON.stringify({
        hash: normalized,
        ...(opts?.filename ? { filename: opts.filename } : {}),
      }),
    })

    let body: Record<string, unknown> = {}
    try {
      body = (await res.json()) as Record<string, unknown>
    } catch {
      /* non-JSON body */
    }

    if (!res.ok) {
      const msg =
        (typeof body.error === 'string' && body.error) ||
        (typeof body.message === 'string' && body.message) ||
        `Satohash stamp failed (HTTP ${res.status})`
      return { ok: false, error: msg, httpStatus: res.status }
    }

    const id = typeof body.id === 'string' ? body.id : undefined
    const status = typeof body.status === 'string' ? body.status : undefined
    return {
      ok: true,
      id,
      status,
      hash: typeof body.hash === 'string' ? body.hash : normalized,
      httpStatus: res.status,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Satohash API unreachable — use stamp guide link',
    }
  }
}

/**
 * GET /api/stamps/:id — proof status for a stamp id. Never throws.
 */
export async function getStamp(id: string): Promise<SatohashGetStampResult> {
  const stampId = sanitizeStampId(id)
  if (!stampId) {
    return { ok: false, error: 'Stamp id is required' }
  }

  try {
    const res = await fetch(`${SATOHASH_API_BASE}/api/stamps/${encodeURIComponent(stampId)}`, {
      method: 'GET',
      headers: { 'X-Satohash-Client': CLIENT_HEADER },
    })

    let body: Record<string, unknown> = {}
    try {
      body = (await res.json()) as Record<string, unknown>
    } catch {
      /* non-JSON */
    }

    if (!res.ok) {
      const msg =
        (typeof body.error === 'string' && body.error) ||
        `Satohash getStamp failed (HTTP ${res.status})`
      return { ok: false, error: msg, httpStatus: res.status, data: body }
    }

    return {
      ok: true,
      id: typeof body.id === 'string' ? body.id : stampId,
      status: typeof body.status === 'string' ? body.status : undefined,
      hash: typeof body.hash === 'string' ? body.hash : undefined,
      filename: typeof body.filename === 'string' ? body.filename : undefined,
      bitcoin_block_height:
        typeof body.bitcoin_block_height === 'number' ? body.bitcoin_block_height : null,
      created_at: typeof body.created_at === 'string' ? body.created_at : undefined,
      confirmed_at: typeof body.confirmed_at === 'string' ? body.confirmed_at : null,
      httpStatus: res.status,
      data: body,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Satohash API unreachable',
    }
  }
}

const TERMINAL_STAMP_STATUSES = new Set([
  'confirmed',
  'anchored',
  'complete',
  'completed',
  'failed',
  'error',
  'rejected',
])

/**
 * Poll GET /api/stamps/:id until status is terminal or attempts exhausted.
 * Never throws. Used after stampHash to surface Bitcoin anchor progress.
 */
export async function pollStamp(
  id: string,
  opts?: { attempts?: number; intervalMs?: number },
): Promise<SatohashGetStampResult> {
  const attempts = opts?.attempts ?? 5
  const intervalMs = opts?.intervalMs ?? 1500
  let last: SatohashGetStampResult = { ok: false, error: 'No poll attempts' }

  for (let i = 0; i < attempts; i++) {
    last = await getStamp(id)
    if (!last.ok) return last
    const status = (last.status ?? '').toLowerCase()
    if (status && TERMINAL_STAMP_STATUSES.has(status)) return last
    if (last.bitcoin_block_height != null) return last
    if (i < attempts - 1) {
      await new Promise(r => setTimeout(r, intervalMs))
    }
  }
  return last
}
