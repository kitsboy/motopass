/**
 * NIP-05 identity: `name@domain` → pubkey, via the domain's
 * /.well-known/nostr.json. Used to say which npub the visitor is signing with
 * and whether a claimed name actually resolves to it.
 *
 * A verified NIP-05 is domain trust, not a person: the domain owner can change
 * the mapping at any time. The UI labels it that way.
 */

const USER_RE = /^[a-z0-9._-]{1,64}$/i
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
const HEX64 = /^[a-f0-9]{64}$/i

export interface Nip05Identifier {
  name: string
  domain: string
}

export type FetchLike = (url: string) => Promise<{
  ok: boolean
  status?: number
  json: () => Promise<unknown>
}>

export function parseNip05(input: string): Nip05Identifier | null {
  const raw = input.trim()
  if (!raw || raw.includes('://') || raw.includes('/') || /\s/.test(raw)) return null
  const at = raw.lastIndexOf('@')
  if (at <= 0 || at === raw.length - 1) return null
  const name = raw.slice(0, at)
  const domain = raw.slice(at + 1).toLowerCase()
  if (!USER_RE.test(name) || !DOMAIN_RE.test(domain)) return null
  return { name, domain }
}

export function formatNip05(identifier: Nip05Identifier): string {
  return `${identifier.name}@${identifier.domain}`
}

export function nip05Url(input: string | Nip05Identifier): string | null {
  const identifier = typeof input === 'string' ? parseNip05(input) : input
  if (!identifier) return null
  return `https://${identifier.domain}/.well-known/nostr.json?name=${encodeURIComponent(identifier.name)}`
}

export type Nip05Result =
  | { ok: true; identifier: Nip05Identifier; pubkey: string; relays: string[] }
  | { ok: false; error: string }

function hexFromNpub(value: string): string | null {
  // Accept a hex pubkey or an npub, without pulling an encoder into the UI.
  if (HEX64.test(value)) return value.toLowerCase()
  return null
}

/** Resolve the name and read only the pubkey that belongs to it. */
export async function resolveNip05(
  input: string,
  fetchImpl: FetchLike = fetch,
): Promise<Nip05Result> {
  const identifier = parseNip05(input)
  const url = identifier ? nip05Url(identifier) : null
  if (!identifier || !url) return { ok: false, error: 'Use name@domain' }

  let body: unknown
  try {
    const res = await fetchImpl(url)
    if (!res.ok) return { ok: false, error: `nostr.json returned HTTP ${res.status ?? 'error'}` }
    body = await res.json()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'nostr.json unreachable' }
  }

  const names = body && typeof body === 'object' ? (body as { names?: unknown }).names : undefined
  if (!names || typeof names !== 'object') return { ok: false, error: 'nostr.json has no names map' }
  const raw = (names as Record<string, unknown>)[identifier.name]
  const pubkey = typeof raw === 'string' ? hexFromNpub(raw) : null
  if (!pubkey) return { ok: false, error: 'Name is not mapped to a hex pubkey' }

  const relayMap = body && typeof body === 'object' ? (body as { relays?: unknown }).relays : undefined
  const relaysRaw = relayMap && typeof relayMap === 'object' ? (relayMap as Record<string, unknown>)[pubkey] : undefined
  const relays = Array.isArray(relaysRaw)
    ? relaysRaw.filter((relay): relay is string => typeof relay === 'string' && /^wss:\/\//.test(relay))
    : []

  return { ok: true, identifier, pubkey, relays }
}

export type Nip05Verdict = 'match' | 'mismatch' | 'unverified'

/** Does the resolved name belong to the key that is actually signing? */
export function nip05Verdict(resolvedPubkey: string | null, signerPubkey: string | null): Nip05Verdict {
  if (!resolvedPubkey || !signerPubkey) return 'unverified'
  return resolvedPubkey.toLowerCase() === signerPubkey.toLowerCase() ? 'match' : 'mismatch'
}
