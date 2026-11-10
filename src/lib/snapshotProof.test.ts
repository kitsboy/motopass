import { describe, it, expect } from 'vitest'
import {
  loadSnapshotIndex,
  normalizeSourceUrl,
  resetSnapshotIndexCache,
  sha256Text,
  shortHash,
  snapshotFor,
  verifySnapshot,
  type SnapshotIndex,
} from './snapshotProof'

/* sha256("abc") — a value anyone can reproduce. */
const ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

const INDEX: SnapshotIndex = {
  'https://www.migracion.gob.pa': {
    rule: { hash: ABC, text: 'abc' },
  },
  'https://www.gub.uy/tramites/residencia-legal': {
    rule: { hash: ABC, text: 'abc' },
  },
}

describe('normalizeSourceUrl', () => {
  it('lowercases the host and drops trailing slashes and fragments', () => {
    expect(normalizeSourceUrl('HTTPS://WWW.GUB.UY/Tramites/Residencia-Legal/#fees')).toBe(
      'https://www.gub.uy/Tramites/Residencia-Legal',
    )
    expect(normalizeSourceUrl('https://example.gov/')).toBe('https://example.gov')
  })

  it('refuses non-http(s) and junk', () => {
    expect(normalizeSourceUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeSourceUrl('not a url')).toBeNull()
    expect(normalizeSourceUrl('')).toBeNull()
  })
})

describe('snapshotFor', () => {
  it('matches an exact archived URL', () => {
    const entry = snapshotFor(INDEX, 'https://www.gub.uy/tramites/residencia-legal')
    expect(entry?.hash).toBe(ABC)
  })

  it('falls back to the origin archive for a deep link', () => {
    const entry = snapshotFor(INDEX, 'https://www.migracion.gob.pa/tramites/permisos')
    expect(entry?.text).toBe('abc')
  })

  it('prefers the longest matching prefix', () => {
    const nested: SnapshotIndex = {
      'https://a.gov': { rule: { hash: ABC, text: 'origin' } },
      'https://a.gov/x': { rule: { hash: ABC, text: 'nested' } },
    }
    expect(snapshotFor(nested, 'https://a.gov/x/y')?.text).toBe('nested')
  })

  it('returns null for an unknown host, an unknown bucket or no index', () => {
    expect(snapshotFor(INDEX, 'https://unknown.gov/path')).toBeNull()
    expect(snapshotFor(INDEX, 'https://www.migracion.gob.pa', 'missing-bucket')).toBeNull()
    expect(snapshotFor(null, 'https://www.migracion.gob.pa')).toBeNull()
  })
})

describe('verifySnapshot', () => {
  it('confirms text that hashes to the recorded digest', async () => {
    await expect(verifySnapshot('abc', ABC)).resolves.toBe(true)
  })

  it('rejects altered text, a short hash and a non-hash string', async () => {
    await expect(verifySnapshot('abd', ABC)).resolves.toBe(false)
    await expect(verifySnapshot('abc', 'abc123')).resolves.toBe(false)
    await expect(verifySnapshot('abc', 'zzzz')).resolves.toBe(false)
  })

  it('hashes text deterministically and shortens digests for display', async () => {
    expect(await sha256Text('abc')).toBe(ABC)
    expect(shortHash(ABC)).toBe('ba7816bf8f01')
    expect(shortHash(ABC, 8)).toBe('ba7816bf')
  })
})

describe('loadSnapshotIndex', () => {
  it('caches the index and returns null when the fetch fails', async () => {
    resetSnapshotIndexCache()
    let calls = 0
    const fake = async () => {
      calls += 1
      return { ok: true, json: async () => INDEX }
    }
    const first = await loadSnapshotIndex(fake)
    const second = await loadSnapshotIndex(fake)
    expect(first).toBe(second)
    expect(calls).toBe(1)

    resetSnapshotIndexCache()
    const failed = await loadSnapshotIndex(async () => {
      throw new Error('offline')
    })
    expect(failed).toBeNull()
    resetSnapshotIndexCache()
  })
})
