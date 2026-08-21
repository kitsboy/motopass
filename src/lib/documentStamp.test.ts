import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import {
  deriveDocStatus,
  loadStampedDocuments,
  saveStampedDocuments,
  deleteStampedDocument,
  upsertStampedDocument,
  registryToProfileDocuments,
  deriveProfileStatus,
  documentVerifyUrl,
  formatBytes,
  sha256File,
  restampHash,
  type StampedDocument,
} from './documentStamp'
import { stampHash } from './satohash'

const mockStampHash = vi.mocked(stampHash)

vi.mock('./satohash', async importOriginal => {
  const actual = await importOriginal<typeof import('./satohash')>()
  return {
    ...actual,
    stampHash: vi.fn(async (hash: string) => ({ ok: true, id: `stamp-${hash.slice(0, 6)}` })),
    pollStamp: vi.fn(async () => ({ ok: true, status: 'confirmed', bitcoin_block_height: 958100 })),
  }
})

const DOC: StampedDocument = {
  id: 'x1',
  name: 'passport.pdf',
  size: 2048,
  type: 'application/pdf',
  hash: 'a1'.repeat(32),
  stampId: 'uuid-1',
  status: 'pending',
  createdAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-08-20T00:00:00.000Z',
}

function mockStorage(store: Record<string, string>) {
  const getItem = vi.fn((k: string) => store[k] ?? null)
  const setItem = vi.fn((k: string, v: string) => {
    store[k] = v
  })
  const removeItem = vi.fn((k: string) => {
    delete store[k]
  })
  vi.stubGlobal('localStorage', { getItem, setItem, removeItem })
  return { getItem, setItem }
}

describe('deriveDocStatus', () => {
  it('maps API status + block height to honest statuses', () => {
    expect(deriveDocStatus('pending', null)).toBe('pending')
    expect(deriveDocStatus('confirmed', null)).toBe('confirmed')
    expect(deriveDocStatus('anchored', null)).toBe('confirmed')
    expect(deriveDocStatus('pending', 958093)).toBe('confirmed') // block wins
    expect(deriveDocStatus('failed', null)).toBe('error')
    expect(deriveDocStatus('rejected', null)).toBe('error')
    expect(deriveDocStatus(undefined, undefined)).toBe('pending')
  })
})

describe('registry persistence', () => {
  let store: Record<string, string>
  beforeEach(() => {
    store = {}
    mockStorage(store)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('round-trips documents through localStorage', () => {
    expect(loadStampedDocuments()).toEqual([])
    saveStampedDocuments([DOC])
    expect(loadStampedDocuments()).toEqual([DOC])
  })

  it('tolerates corrupt storage', () => {
    store['motopass-vault-documents'] = 'not json{'
    expect(loadStampedDocuments()).toEqual([])
  })

  it('deletes by id', () => {
    saveStampedDocuments([DOC, { ...DOC, id: 'x2' }])
    const next = deleteStampedDocument('x1')
    expect(next.map(d => d.id)).toEqual(['x2'])
  })

  it('upserts in place by id', () => {
    saveStampedDocuments([DOC, { ...DOC, id: 'x2' }])
    const next = upsertStampedDocument({ ...DOC, status: 'confirmed', blockHeight: 958093 })
    expect(next).toHaveLength(2)
    expect(next[0]).toMatchObject({ id: 'x1', status: 'confirmed', blockHeight: 958093 })
    expect(next[1].id).toBe('x2')
  })

  it('upsert prepends new documents (newest first)', () => {
    saveStampedDocuments([DOC])
    const next = upsertStampedDocument({ ...DOC, id: 'x3' })
    expect(next.map(d => d.id)).toEqual(['x3', 'x1'])
  })
})

describe('registry → profile bridge', () => {
  it('maps registry entries to UserDocument mirror with honest statuses', () => {
    const registry: StampedDocument[] = [
      { ...DOC, id: 'c1', status: 'confirmed', blockHeight: 958093, hash: 'bb'.repeat(32) },
      { ...DOC, id: 'p1', status: 'pending' },
      { ...DOC, id: 'e1', status: 'error', note: 'API unreachable' },
    ]
    const mirror = registryToProfileDocuments(registry)
    expect(mirror.map(d => d.status)).toEqual(['stamped', 'pending', 'error'])
    expect(mirror[0].hash).toBe('bb'.repeat(32))
    expect(mirror[0].satohashUrl).toBe(`https://satohash.io/verify/${'bb'.repeat(32)}`)
    expect(mirror[0].name).toBe('passport.pdf') // display-only, never hashed on-chain
  })

  it('derives profile status honestly without downgrading', () => {
    const confirmed = [{ ...DOC, status: 'confirmed' as const }]
    const pending = [{ ...DOC, status: 'pending' as const }]
    expect(deriveProfileStatus(confirmed, 'registered')).toBe('stamped')
    expect(deriveProfileStatus(pending, 'registered')).toBe('documents')
    expect(deriveProfileStatus([], 'registered')).toBe('registered')
    expect(deriveProfileStatus(pending, 'agent_assigned')).toBe('agent_assigned')
    expect(deriveProfileStatus(confirmed, 'agent_assigned')).toBe('stamped')
  })
})

describe('restampHash', () => {
  it('re-submits the stored hash and derives an honest confirmed status', async () => {
    const doc: StampedDocument = { ...DOC, status: 'error', note: 'API unreachable' }
    const updated = await restampHash(doc)
    expect(mockStampHash).toHaveBeenCalledWith('a1'.repeat(32), expect.objectContaining({ filename: expect.stringContaining('passport') }))
    expect(updated.status).toBe('confirmed')
    expect(updated.blockHeight).toBe(958100)
    expect(updated.stampId).toBe('stamp-a1a1a1')
    expect(updated.note).toBeUndefined()
  })

  it('surfaces API failure as an honest error with the hash preserved', async () => {
    mockStampHash.mockResolvedValueOnce({ ok: false, error: 'Rate limited' })
    const doc: StampedDocument = { ...DOC, status: 'error' }
    const updated = await restampHash(doc)
    expect(updated.status).toBe('error')
    expect(updated.hash).toBe(DOC.hash)
    expect(updated.note).toContain('Rate limited')
  })

  it('rejects a doc with no hash without calling the API', async () => {
    mockStampHash.mockClear()
    const updated = await restampHash({ ...DOC, hash: '' })
    expect(updated.status).toBe('error')
    expect(mockStampHash).not.toHaveBeenCalled()
  })
})

describe('sha256File', () => {
  it('hashes raw file bytes deterministically', async () => {
    // sha256('hello') — known vector.
    const blob = new Blob(['hello'], { type: 'text/plain' })
    expect(await sha256File(blob)).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  })
})

describe('verify url + bytes', () => {
  it('returns allowlisted satohash verify url for a 64-hex hash', () => {
    expect(documentVerifyUrl(DOC)).toBe(`https://satohash.io/verify/${'a1'.repeat(32)}`)
  })

  it('returns undefined for missing hash', () => {
    expect(documentVerifyUrl({ ...DOC, hash: '' })).toBeUndefined()
  })

  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })
})
