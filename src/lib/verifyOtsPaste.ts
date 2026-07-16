import type { VerifyResult } from '../types/proof'

/** Parse pasted OTS file content (hex dump or base64) into bytes for structural verify. */
export function parseOtsPasteContent(input: string): Uint8Array | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length % 4 === 0 && !/^[0-9a-f\s]+$/i.test(trimmed)) {
    try {
      const b64 = trimmed.replace(/\s/g, '')
      const binary = atob(b64)
      return Uint8Array.from(binary, c => c.charCodeAt(0))
    } catch {
      return null
    }
  }

  const hex = trimmed.replace(/[^0-9a-f]/gi, '')
  if (hex.length >= 64 && hex.length % 2 === 0) {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    }
    return bytes
  }

  return null
}

export function verifyOtsPasteContent(
  input: string,
  expectedHash: string,
): VerifyResult {
  const hash = expectedHash.trim().toLowerCase()
  const hashValid = /^[a-f0-9]{64}$/.test(hash)

  const bytes = parseOtsPasteContent(input)
  if (!bytes) {
    return {
      verified: false,
      hash: hashValid ? hash : expectedHash,
      mode: 'failed',
      blockTime: null,
      message: 'Could not parse OTS content — paste hex dump or base64 from a .ots file',
    }
  }

  if (bytes.length < 32) {
    return {
      verified: false,
      hash: hashValid ? hash : expectedHash,
      mode: 'structural',
      blockTime: null,
      message: 'OTS payload too small — file may be corrupt',
    }
  }

  const looksLikeOts = bytes.length >= 64 && bytes[0] !== 0x7b

  return {
    verified: looksLikeOts,
    hash: hashValid ? hash : '',
    mode: 'structural',
    blockTime: null,
    message: looksLikeOts
      ? `OTS content parsed (${bytes.length} bytes)${hashValid ? ` · paired with ${hash.slice(0, 12)}…` : ''}`
      : 'Content does not look like OpenTimestamps binary — try uploading the .ots file directly',
  }
}