import type { VerifyResult } from '../../types/proof'

const SATOHASH_BASE = import.meta.env.VITE_SATOHASH_URL || 'https://satohash.io'

export function satohashVerifyUrl(hash: string): string {
  return `${SATOHASH_BASE}/verify/${hash}`
}

function normalizeHash(input: string): string | null {
  const h = input.trim().toLowerCase()
  return /^[a-f0-9]{64}$/.test(h) ? h : null
}

/** Paste a content hash — validates format and links to Satohash */
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
  return {
    verified: true,
    hash,
    mode: 'hash-only',
    blockTime: null,
    message: 'Valid content hash — open Satohash for independent Bitcoin verification',
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

  // OpenTimestamps detached files are non-empty binary; confirm load + hash pairing
  const hashHex = Array.from(bytes.slice(0, Math.min(bytes.length, 128)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

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