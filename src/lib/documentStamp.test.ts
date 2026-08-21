import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import {
  deriveDocStatus,
  loadStampedDocuments,
  saveStampedDocuments,
  deleteStampedDocument,
  documentVerifyUrl,
  formatBytes,
  sha256File,
  type StampedDocument,
} from './documentStamp'

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
