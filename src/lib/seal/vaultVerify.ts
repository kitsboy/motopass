import type { VerifyResult } from '../../types/proof'
import { verifyHashOnChain } from '../chainVerify'

export { satohashVerifyUrl } from '../satohash'

function normalizeHash(input: string): string | null {
  const h = input.trim().toLowerCase()
  return /^[a-f0-9]{64}$/.test(h) ? h : null
}

/** Parse one hash per line from a multi-line paste */
export function parseHashLines(input: string): string[] {
  const seen = new Set<string>()
  const hashes: string[] = []
  for (const line of input.split(/\r?\n/)) {
    const hash = normalizeHash(line)
    if (hash && !seen.has(hash)) {
      seen.add(hash)
      hashes.push(hash)
    }
  }
  return hashes
}

/**
 * Ask the family verifier whether a content hash is Bitcoin-anchored.
 *
 * Chain-backed (t_edc1bd27): the verdict comes from POST /api/verify — method
 * ('bitcoind'|'esplora') + resolved block height when verified — and registry
 * status is never presented as proof. An unreachable verifier is reported as
 * "could not check" (offline), which is NOT the same as "not proven".
 */
export async function verifyHashPaste(hashInput: string): Promise<VerifyResult> {
  const hash = normalizeHash(hashInput)
  if (!hash) {
    return {
      verified: false,
      hash: hashInput.trim(),
      mode: 'failed',
      blockTime: null,
      message: 'Invalid SHA-256 — expected 64 hex characters',
    }
  }

  const result = await verifyHashOnChain(hash)

  if (!result.ok) {
    return {
      verified: false,
      hash,
      mode: 'failed',
      blockTime: null,
      chainState: null,
      offline: result.offline,
      message: result.offline
        ? `Could not reach the Bitcoin verifier — nothing was proven or disproven. (${result.error})`
        : result.error,
    }
  }

  const v = result.verdict
  if (v.verified) {
    return {
      verified: true,
      hash,
      mode: 'chain',
      blockTime: v.block_time != null ? new Date(v.block_time * 1000).toISOString() : null,
      chainState: 'confirmed',
      verifiedMethod: v.verified_method,
      blockHeight: v.bitcoin_block_height,
      otsUrl: v.ots_download_url ?? undefined,
      message: v.verified_method === 'esplora'
        ? `Bitcoin-anchored (public explorer) · block ${v.bitcoin_block_height}`
        : `Bitcoin-anchored (own node) · block ${v.bitcoin_block_height}`,
    }
  }

  const pending = v.reason === 'no_block_attestation'
  return {
    verified: false,
    hash,
    mode: 'chain',
    blockTime: null,
    chainState: pending ? 'pending' : 'not-proven',
    verifiedMethod: null,
    blockHeight: null,
    otsUrl: v.ots_download_url ?? undefined,
    reason: v.reason ?? v.error ?? undefined,
    message: pending
      ? 'Recorded, not yet anchored to Bitcoin — check again after the next blocks.'
      : `Not proven${v.error ? ` — ${v.error}` : v.reason ? ` — ${v.reason}` : ' against a Bitcoin block'}`,
  }
}

/**
 * Verify an uploaded .ots file against expected content_hash.
 * Browser build uses structural checks (opentimestamps is Node-only).
 * Full OTS verify: download matching .ots from program card or run npm run seal:verify-all.
 */
export async function verifyOtsInBrowser(
  file: File,
  expectedHash: string,
): Promise<VerifyResult> {
  const hash = normalizeHash(expectedHash)
  if (!hash) {
    return {
      verified: false,
      hash: expectedHash,
      mode: 'failed',
      blockTime: null,
      message: 'Expected content hash missing or invalid — paste hash or pick a program below',
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer())

  if (bytes.length < 32) {
    return {
      verified: false,
      hash,
      mode: 'structural',
      blockTime: null,
      message: 'OTS file too small — file may be corrupt',
    }
  }

  // OpenTimestamps detached files are non-empty binary; confirm load
  const looksLikeOts = bytes.length >= 64 && (bytes[0] !== 0x7b) // not raw JSON

  if (!looksLikeOts) {
    return {
      verified: false,
      hash,
      mode: 'structural',
      blockTime: null,
      message: 'File does not look like a valid .ots timestamp — try downloading from program card',
    }
  }

  return {
    verified: true,
    hash,
    mode: 'structural',
    blockTime: null,
    message: `OTS file loaded (${file.size} bytes) — paired with hash ${hash.slice(0, 12)}… · confirm on Satohash`,
  }
}

/** Optional: compare uploaded file to server-hosted OTS for a program */
export async function verifyOtsAgainstHosted(
  file: File,
  otsPath: string,
  expectedHash: string,
): Promise<VerifyResult> {
  const base = await verifyOtsInBrowser(file, expectedHash)
  if (!base.verified || !otsPath) return base

  try {
    const res = await fetch(otsPath)
    if (!res.ok) {
      return { ...base, message: `${base.message} · hosted ${otsPath} not found` }
    }
    const hosted = new Uint8Array(await res.arrayBuffer())
    const uploaded = new Uint8Array(await file.arrayBuffer())
    if (hosted.length !== uploaded.length) {
      return {
        verified: false,
        hash: expectedHash,
        mode: 'structural',
        blockTime: null,
        message: 'Uploaded OTS size differs from hosted proof — may be outdated',
      }
    }
    const match = hosted.every((b, i) => b === uploaded[i])
    return {
      verified: match,
      hash: expectedHash,
      mode: 'structural',
      blockTime: null,
      message: match
        ? 'Uploaded OTS matches hosted proof byte-for-byte'
        : 'Uploaded OTS differs from hosted proof on motopass.giveabit.io',
    }
  } catch {
    return base
  }
}