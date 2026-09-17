/**
 * chainVerify — the ONE live "is this hash anchored to Bitcoin?" call.
 *
 * Contract (verified live 2026-09-16, api.satohash.io gitSha 910a065):
 *   POST /api/verify  {"hash": "<64-hex>"}
 *   -> { verified, verified_method: 'bitcoind'|'esplora', bitcoin_block_height,
 *        block_time, block_hash, ots_download_url, explainer, reason, error,
 *        registry: { found, status }, registry_status, source, ... }
 *
 * Honesty rules baked in here (t_da054829 deliverable 3 · t_edc1bd27):
 *   - ONLY `verified === true` is proof, and it always carries a method + a
 *     resolved block height. `registry.status` is Satohash's index of proofs,
 *     NOT proof — it is never allowed to upgrade a verdict.
 *   - A transport/API failure returns `ok:false` — it is NOT "not proven".
 *     "We could not check" and "the chain says no" are different claims and the
 *     UI must never blur them.
 */
import { SATOHASH_API_BASE } from './satohash'
import { isAllowedSatohashUrl, normalizeSha256 } from './timestampSecurity'

export interface ChainVerdict {
  verified: boolean
  verified_method: 'bitcoind' | 'esplora' | null
  bitcoin_block_height: number | null
  block_time: number | null
  block_hash: string | null
  ots_download_url: string | null
  explainer: string | null
  reason: string | null
  error: string | null
  registry_status: string | null
  source: string | null
}

export type ChainVerifyResult =
  | { ok: true; hash: string; verdict: ChainVerdict }
  | { ok: false; hash: string; error: string; offline: boolean }

type RawVerdict = Record<string, unknown>

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Normalize an /api/verify body — unknown shapes never invent a verdict. */
export function normalizeChainVerdict(raw: RawVerdict | null | undefined): ChainVerdict {
  const body = raw ?? {}
  const method = body.verified_method
  const ots = str(body.ots_download_url)

  return {
    verified: body.verified === true,
    // A method is only ever reported when the chain actually resolved a block.
    verified_method:
      body.verified === true && (method === 'bitcoind' || method === 'esplora') ? method : null,
    bitcoin_block_height: body.verified === true ? num(body.bitcoin_block_height) : null,
    block_time: num(body.block_time),
    block_hash: str(body.block_hash),
    // Only allowlisted Satohash URLs — an .ots link the user is asked to trust
    // must not be redirectable to a third party.
    ots_download_url: ots && isAllowedSatohashUrl(ots) ? ots : null,
    explainer: str(body.explainer),
    reason: str(body.reason),
    error: str(body.error),
    registry_status: str(body.registry_status),
    source: str(body.source),
  }
}

/**
 * One honest line for a verdict — method + height when verified, the plain
 * reason when it did not resolve, and never a registry flag dressed as proof.
 * (Mirrors satohash's V5Pages batch detail column.)
 */
export function verdictDetailLine(verdict: ChainVerdict): string {
  if (verdict.verified) {
    const method = verdict.verified_method ?? 'chain'
    const height = verdict.bitcoin_block_height
    return height != null ? `${method} · block ${height}` : method
  }
  if (verdict.reason === 'no_block_attestation') return 'pending — waiting for Bitcoin'
  return `not proven${verdict.error ? ` · ${verdict.error}` : verdict.reason ? ` · ${verdict.reason}` : ''}`
}

const DEFAULT_TIMEOUT_MS = 12_000

/**
 * Ask the family verifier. Never throws: unreachable API => { ok:false }.
 * Verified against a live call: verified:true always carries a method + height;
 * a forged hash comes back verified:false with an error and no .ots.
 */
export async function verifyHashOnChain(
  hashInput: string,
  opts: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ChainVerifyResult> {
  const raw = hashInput?.trim() ?? ''
  const hash = normalizeSha256(raw) || (/^[a-f0-9]{64}$/i.test(raw) ? raw.toLowerCase() : null)
  if (!hash) {
    return { ok: false, hash: raw, error: 'Invalid SHA-256 — expected 64 hex characters', offline: false }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const onOuterAbort = () => controller.abort()
  opts.signal?.addEventListener('abort', onOuterAbort)

  try {
    const res = await fetch(`${SATOHASH_API_BASE.replace(/\/$/, '')}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Satohash-Client': 'motopass' },
      body: JSON.stringify({ hash }),
      signal: controller.signal,
    })
    const body = (await res.json().catch(() => null)) as RawVerdict | null
    if (!body) {
      return { ok: false, hash, error: `Verifier returned no verdict (HTTP ${res.status})`, offline: res.status >= 500 }
    }
    // 404 is a legitimate answer ("no such proof") when it still carries a body.
    if (!res.ok && res.status >= 500) {
      return { ok: false, hash, error: `Verifier unavailable (HTTP ${res.status})`, offline: true }
    }
    return { ok: true, hash, verdict: normalizeChainVerdict(body) }
  } catch (e) {
    return {
      ok: false,
      hash,
      error: e instanceof Error ? e.message : String(e),
      offline: true,
    }
  } finally {
    clearTimeout(timeout)
    opts.signal?.removeEventListener('abort', onOuterAbort)
  }
}
