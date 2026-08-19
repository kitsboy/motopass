/** Guards for Nostr + Satohash timestamp attestations. Never trust tags we did not allowlist. */

export const SHA256_HEX = /^[a-f0-9]{64}$/i
const STAMP_ID = /^[a-zA-Z0-9._-]{1,128}$/
const MAX_LABEL = 80
const MAX_BLOCK = 20_000_000

export function normalizeSha256(hash: string): string | null {
  const n = hash.trim().toLowerCase()
  return SHA256_HEX.test(n) ? n : null
}

export function sanitizeStampId(id: string): string | null {
  const t = id.trim()
  return STAMP_ID.test(t) ? t : null
}

export function sanitizeShortLabel(value: string, max = MAX_LABEL): string | null {
  let cleaned = ''
  for (const ch of value) {
    const code = ch.charCodeAt(0)
    if (code < 32 || code === 127) continue
    cleaned += ch
  }
  const t = cleaned.trim()
  if (!t) return null
  return t.slice(0, max)
}

export function sanitizeBlockHeight(n: number): number | null {
  if (!Number.isInteger(n) || n < 0 || n > MAX_BLOCK) return null
  return n
}

/** Relative vault proof path only — no scheme, no parent traversal. */
export function sanitizeOtsPath(path: string): string | null {
  const t = path.trim()
  if (!t || t.length > 200 || t.includes('..') || /^[a-z][a-z0-9+.-]*:/i.test(t)) return null
  if (!/^\/?proofs\/[a-zA-Z0-9._/-]+\.ots$/i.test(t)) return null
  return t.startsWith('/') ? t : `/${t}`
}

export function satohashAllowedOrigins(): string[] {
  const bases = [
    import.meta.env.VITE_SATOHASH_URL || 'https://satohash.io',
    import.meta.env.VITE_SATOHASH_API_URL || 'https://api.satohash.io',
    'https://satohash.io',
    'https://satohash.giveabit.io',
  ]
  const origins = new Set<string>()
  for (const raw of bases) {
    try {
      const u = new URL(raw)
      if (u.protocol === 'https:') origins.add(u.origin)
    } catch {
      /* skip invalid env */
    }
  }
  return [...origins]
}

export function isAllowedSatohashUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    if (u.username || u.password) return false
    return satohashAllowedOrigins().includes(u.origin)
  } catch {
    return false
  }
}

export type EventTemplateLike = {
  kind: number
  created_at: number
  tags: string[][]
  content: string
}

/** Refuse to publish if the NIP-07 signer swapped kind, tags, or content. */
export function signedEventMatchesTemplate(
  signed: { kind: number; created_at: number; tags: unknown; content: string },
  template: EventTemplateLike,
): boolean {
  if (signed.kind !== template.kind) return false
  if (signed.created_at !== template.created_at) return false
  if (signed.content !== template.content) return false
  return JSON.stringify(signed.tags) === JSON.stringify(template.tags)
}

export type TimestampAttestationCheck = {
  ok: boolean
  error?: string
}

/**
 * Unsigned template must be a 30078 attestation we built:
 * 64-hex hash, optional allowlisted Satohash URL, no unexpected schemes.
 */
export function validateTimestampTemplate(event: EventTemplateLike): TimestampAttestationCheck {
  if (event.kind !== 30078) {
    return { ok: false, error: 'Only kind 30078 timestamp attestations may be announced' }
  }
  const hash = event.tags.find(t => t[0] === 'hash')?.[1]
  if (!hash || !normalizeSha256(hash)) {
    return { ok: false, error: 'Timestamp event requires a 64-hex SHA-256 hash tag' }
  }
  const satohash = event.tags.find(t => t[0] === 'satohash')?.[1]
  if (satohash && !isAllowedSatohashUrl(satohash)) {
    return { ok: false, error: 'Satohash URL is not on the allowlisted origin' }
  }
  const stampId = event.tags.find(t => t[0] === 'stamp-id')?.[1]
  if (stampId && !sanitizeStampId(stampId)) {
    return { ok: false, error: 'Stamp id failed allowlist' }
  }
  const ots = event.tags.find(t => t[0] === 'ots')?.[1]
  if (ots && !sanitizeOtsPath(ots)) {
    return { ok: false, error: 'OTS path is not a relative /proofs/*.ots file' }
  }
  return { ok: true }
}
