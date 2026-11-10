import { describe, expect, it } from 'vitest'
import { formatNip05, nip05Url, nip05Verdict, parseNip05, resolveNip05 } from './nip05'

const PUBKEY = 'a'.repeat(64)

function fetchJson(body: unknown, ok = true, status = 200): (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  return async () => ({ ok, status, json: async () => body })
}

describe('parseNip05', () => {
  it('accepts name@domain and lowercases the domain', () => {
    expect(parseNip05('motopass@GiveABit.io')).toEqual({ name: 'motopass', domain: 'giveabit.io' })
    expect(parseNip05('_@example.com')).toEqual({ name: '_', domain: 'example.com' })
  })

  it('rejects schemes, paths, ports and whitespace', () => {
    expect(parseNip05('https://example.com')).toBeNull()
    expect(parseNip05('a@b@example.com')).toBeNull()
    expect(parseNip05('name@example.com/path')).toBeNull()
    expect(parseNip05('name@example.com:443')).toBeNull()
    expect(parseNip05('two words@example.com')).toBeNull()
    expect(parseNip05('name@localhost')).toBeNull()
  })

  it('builds the well-known URL with an encoded name', () => {
    expect(nip05Url('motopass@example.com')).toBe('https://example.com/.well-known/nostr.json?name=motopass')
    expect(formatNip05({ name: 'x', domain: 'example.com' })).toBe('x@example.com')
  })
})

describe('resolveNip05', () => {
  it('returns the pubkey and wss relays for that name only', async () => {
    const result = await resolveNip05(
      'cam@example.com',
      fetchJson({
        names: { cam: PUBKEY, other: 'b'.repeat(64) },
        relays: { [PUBKEY]: ['wss://relay.example.com', 'https://not-a-relay'] },
      }),
    )
    expect(result).toEqual({
      ok: true,
      identifier: { name: 'cam', domain: 'example.com' },
      pubkey: PUBKEY,
      relays: ['wss://relay.example.com'],
    })
  })

  it('does not fall back to another name in the same file', async () => {
    const result = await resolveNip05('nobody@example.com', fetchJson({ names: { cam: PUBKEY } }))
    expect(result).toEqual({ ok: false, error: 'Name is not mapped to a hex pubkey' })
  })

  it('reports HTTP failure and junk as errors', async () => {
    expect(await resolveNip05('cam@example.com', fetchJson({}, false, 404))).toEqual({
      ok: false,
      error: 'nostr.json returned HTTP 404',
    })
    expect(await resolveNip05('cam@example.com', fetchJson({ names: { cam: 'npub1xyz' } }))).toEqual({
      ok: false,
      error: 'Name is not mapped to a hex pubkey',
    })
  })
})

describe('nip05Verdict', () => {
  it('compares case-insensitively and never guesses', () => {
    expect(nip05Verdict(PUBKEY.toUpperCase(), PUBKEY)).toBe('match')
    expect(nip05Verdict(PUBKEY, 'b'.repeat(64))).toBe('mismatch')
    expect(nip05Verdict(null, PUBKEY)).toBe('unverified')
  })
})
