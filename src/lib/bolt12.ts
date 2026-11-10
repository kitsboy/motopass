/**
 * BOLT12 offer checks.
 *
 * MotoPass cannot issue an offer — that needs the wallet/node that will be
 * paid. What it can do is refuse to show a pasted string as payable unless it
 * is a well-formed offer: `lno1…`, bech32 checksum valid. The checksum catches
 * the realistic failure (a truncated or edited paste); the wallet resolves the
 * contents, so nothing here decodes or claims to interpret the offer's fields.
 *
 * Recurring payment also lives in the wallet: an offer can carry a recurrence,
 * but nothing in a browser tab can charge on a schedule.
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

/** Bech32 (constant 1), not bech32m — that is what BOLT12 offers use. */
export function decodeBech32(raw: string): Bech32Decode {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Empty string' }
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) {
    return { ok: false, error: 'Mixed case' }
  }
  const lower = value.toLowerCase()
  const sep = lower.lastIndexOf('1')
  if (sep < 1 || sep + 7 > lower.length) return { ok: false, error: 'No bech32 separator' }

  const hrp = lower.slice(0, sep)
  const data = lower.slice(sep + 1)
  const values: number[] = []
  for (const ch of data) {
    const index = CHARSET.indexOf(ch)
    if (index < 0) return { ok: false, error: 'Character outside the bech32 charset' }
    values.push(index)
  }
  if (polymod([...hrpExpand(hrp), ...values]) !== 1) return { ok: false, error: 'Checksum failed' }
  return { ok: true, hrp, words: values.slice(0, -6) }
}

export interface Bolt12Offer {
  /** The lowercased offer, ready for a `lightning:` URI. */
  offer: string
  hrp: 'lno'
  /** Number of 5-bit data words after the checksum — shape, not meaning. */
  wordCount: number
}

export type Bolt12Parse =
  | { ok: true; offer: Bolt12Offer }
  | { ok: false; error: string }

export function parseBolt12Offer(raw: string): Bolt12Parse {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'No offer configured' }
  if (!value.toLowerCase().startsWith('lno1')) {
    return { ok: false, error: 'Not a BOLT12 offer — expected lno1…' }
  }
  if (value.length > 4096) return { ok: false, error: 'Offer is too long to be a BOLT12 string' }
  const decoded = decodeBech32(value)
  if (!decoded.ok) return { ok: false, error: decoded.error }
  if (decoded.hrp !== 'lno') return { ok: false, error: 'Offer prefix does not match its checksum' }
  if (decoded.words.length === 0) return { ok: false, error: 'Offer carries no data' }
  return { ok: true, offer: { offer: value.toLowerCase(), hrp: 'lno', wordCount: decoded.words.length } }
}

/** Wallet deep link for a validated offer. */
export function offerDeepLink(raw: string): string | null {
  const parsed = parseBolt12Offer(raw)
  return parsed.ok ? `lightning:${parsed.offer.offer}` : null
}

/** Short, copy-safe label: prefix and tail, never a truncated *valid* string. */
export function shortOffer(raw: string): string {
  const value = raw.trim()
  if (value.length <= 20) return value
  return `${value.slice(0, 10)}…${value.slice(-6)}`
}
