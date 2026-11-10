const HEX64 = /^[a-f0-9]{64}$/i

/**
 * Preimage checking, in the browser.
 *
 * A Lightning payment hash is SHA-256 of the preimage the payer's wallet
 * reveals. Comparing the two locally is the one receipt claim that needs no
 * relay, no node and no third party — so it is done here, and the UI never
 * calls a match "proof of payment" beyond that hash relation.
 */

export function isHex64(value: string): boolean {
  return HEX64.test(value.trim())
}

export function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.trim().toLowerCase()
  if (!HEX64.test(clean)) return null
  const bytes = new Uint8Array(clean.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(clean.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/** SHA-256 of a 32-byte hex value, or null when the input or WebCrypto is unusable. */
export async function sha256Hex(hex: string): Promise<string | null> {
  const bytes = hexToBytes(hex)
  if (!bytes) return null
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return null
  try {
    // Copy into a plain ArrayBuffer so the digest input is a BufferSource on
    // every lib target (a shared-backing view is not assignable).
    const input = new Uint8Array(bytes.length)
    input.set(bytes)
    const digest = await subtle.digest('SHA-256', input.buffer)
    return bytesToHex(new Uint8Array(digest))
  } catch {
    return null
  }
}

export type PreimageCheck = 'match' | 'mismatch' | 'unreadable'

/** `match` only when sha256(preimage) really equals the payment hash. */
export async function checkPreimage(preimage: string, paymentHash: string): Promise<PreimageCheck> {
  if (!isHex64(preimage) || !isHex64(paymentHash)) return 'unreadable'
  const digest = await sha256Hex(preimage)
  if (!digest) return 'unreadable'
  return digest === paymentHash.trim().toLowerCase() ? 'match' : 'mismatch'
}
