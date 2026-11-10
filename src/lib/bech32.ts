/**
 * Bech32, shared by BOLT11 (checksum) and BOLT12 (no checksum).
 *
 * BOLT11 appends the six-word bech32 checksum; BOLT12 deliberately does not
 * ("There is no checksum, unlike bech32m"). Keeping both modes in one decoder
 * stops the two formats from growing subtly different charset rules.
 */

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function polymod(values: number[]): number {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i += 1) {
      if ((top >>> i) & 1) checksum ^= GENERATOR[i]
    }
  }
  return checksum >>> 0
}

function hrpExpand(hrp: string): number[] {
  const out: number[] = []
  for (const ch of hrp) out.push(ch.charCodeAt(0) >>> 5)
  out.push(0)
  for (const ch of hrp) out.push(ch.charCodeAt(0) & 31)
  return out
}

export type Bech32Decode =
  | { ok: true; hrp: string; words: number[] }
  | { ok: false; error: string }

/**
 * Decode a bech32 string. `checksum: false` is BOLT12's checksum-less variant.
 * Mixed case is refused rather than silently lowercased, per BIP-173.
 */
export function bech32Decode(raw: string, opts: { checksum?: boolean } = {}): Bech32Decode {
  const checksum = opts.checksum ?? true
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Empty string' }
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) {
    return { ok: false, error: 'Mixed case' }
  }
  const lower = value.toLowerCase()
  const sep = lower.lastIndexOf('1')
  const minimumTail = checksum ? 7 : 1
  if (sep < 1 || sep + minimumTail > lower.length) {
    return { ok: false, error: 'No bech32 separator' }
  }

  const hrp = lower.slice(0, sep)
  const data = lower.slice(sep + 1)
  const values: number[] = []
  for (const ch of data) {
    const index = CHARSET.indexOf(ch)
    if (index < 0) return { ok: false, error: 'Character outside the bech32 charset' }
    values.push(index)
  }

  if (checksum) {
    if (values.length < 6) return { ok: false, error: 'Checksum is missing' }
    if (polymod([...hrpExpand(hrp), ...values]) !== 1) return { ok: false, error: 'Checksum failed' }
    return { ok: true, hrp, words: values.slice(0, -6) }
  }

  return { ok: true, hrp, words: values }
}

/**
 * Regroup 5-bit words into bytes. Returns null on a group that does not pad to
 * a whole byte, or on non-zero padding bits — both mean the string was edited.
 */
export function wordsToBytes(words: number[]): Uint8Array | null {
  let accumulator = 0
  let bits = 0
  const out: number[] = []
  for (const word of words) {
    if (!Number.isInteger(word) || word < 0 || word > 31) return null
    accumulator = (accumulator << 5) | word
    bits += 5
    while (bits >= 8) {
      bits -= 8
      out.push((accumulator >>> bits) & 0xff)
    }
  }
  if (bits >= 5) return null
  if (bits > 0 && (accumulator & ((1 << bits) - 1)) !== 0) return null
  return Uint8Array.from(out)
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function bytesToWords(bytes: Uint8Array): number[] {
  let accumulator = 0
  let bits = 0
  const out: number[] = []
  for (const byte of bytes) {
    accumulator = (accumulator << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out.push((accumulator >>> bits) & 31)
    }
  }
  if (bits > 0) out.push((accumulator << (5 - bits)) & 31)
  return out
}

/** Big-endian 5-bit words to a JS number; null when it exceeds safe integer. */
export function wordsToInt(words: number[]): number | null {
  let value = 0
  for (const word of words) {
    value = value * 32 + word
    if (!Number.isSafeInteger(value)) return null
  }
  return value
}

export { CHARSET as BECH32_CHARSET }
