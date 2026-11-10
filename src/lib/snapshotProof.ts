/**
 * Proof for archived source text.
 *
 * `public/data/source-snapshots.json` records, per probed URL, the text that was
 * on the page and the SHA-256 of that text at probe time. A citation is only
 * worth something if the reader can check it, so the browser re-hashes the text
 * and compares — no server involvement, no trust in this site.
 */

export interface SnapshotEntry {
  hash: string
  text: string
}

export type SnapshotIndex = Record<string, Record<string, SnapshotEntry>>

const SHA256_HEX = /^[a-f0-9]{64}$/i

/** Lowercase host, strip default port and trailing slash; null when not a URL. */
export function normalizeSourceUrl(input: string): string | null {
  if (!input?.trim()) return null
  try {
    const url = new URL(input.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    url.hash = ''
    const path = url.pathname.replace(/\/+$/, '')
    return `${url.protocol}//${url.host.toLowerCase()}${path}`
  } catch {
    return null
  }
}

/**
 * Match the most specific archived key for a URL: exact, then origin, then the
 * longest key that is a path prefix. Deterministic, so the same citation always
 * resolves to the same snapshot.
 */
export function snapshotFor(
  index: SnapshotIndex | null | undefined,
  url: string | null | undefined,
  bucket = 'rule',
): SnapshotEntry | null {
  if (!index || !url) return null
  const normalized = normalizeSourceUrl(url)
  if (!normalized) return null

  const candidates = Object.keys(index)
    .map(key => ({ key, normalized: normalizeSourceUrl(key) }))
    .filter((entry): entry is { key: string; normalized: string } => entry.normalized != null)

  const exact = candidates.find(entry => entry.normalized === normalized)
  if (exact) {
    const entry = index[exact.key]?.[bucket] ?? null
    if (entry) return entry
  }

  const prefixes = candidates
    .filter(entry => normalized.startsWith(`${entry.normalized}/`))
    .sort((a, b) => b.normalized.length - a.normalized.length)
  for (const prefix of prefixes) {
    const entry = index[prefix.key]?.[bucket] ?? null
    if (entry) return entry
  }
  return null
}

export function shortHash(hash: string, length = 12): string {
  const clean = hash.trim().toLowerCase()
  return clean.slice(0, Math.max(4, Math.min(length, 64)))
}

export async function sha256Text(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** True only when the archived text hashes to the recorded digest. */
export async function verifySnapshot(text: string, hash: string): Promise<boolean> {
  if (!SHA256_HEX.test(hash.trim())) return false
  try {
    const actual = await sha256Text(text)
    return actual === hash.trim().toLowerCase()
  } catch {
    return false
  }
}

let indexPromise: Promise<SnapshotIndex | null> | null = null

/** Fetch the snapshot index once per session; failures are null, not throws. */
export function loadSnapshotIndex(
  fetchImpl: (input: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }> = fetch,
): Promise<SnapshotIndex | null> {
  if (!indexPromise) {
    indexPromise = fetchImpl('/data/source-snapshots.json')
      .then(async res => (res.ok ? ((await res.json()) as SnapshotIndex) : null))
      .catch(() => null)
  }
  return indexPromise
}

/** Test seam: forget the cached index. */
export function resetSnapshotIndexCache(): void {
  indexPromise = null
}
