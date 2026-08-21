import { describe, expect, it } from 'vitest'
import {
  buildDocumentRegistryBundle,
  documentRegistryBackupJson,
  type DocumentRegistryBundle,
} from './documentRegistryExport'
import type { StampedDocument } from './documentStamp'

const DOC: StampedDocument = {
  id: 'x1',
  name: 'passport.pdf',
  size: 2048,
  type: 'application/pdf',
  hash: 'a1'.repeat(32),
  stampId: 'uuid-1',
  status: 'confirmed',
  blockHeight: 958093,
  createdAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-08-20T00:00:00.000Z',
}

describe('documentRegistryExport', () => {
  it('builds a portable v1 bundle with verify links', () => {
    const bundle = buildDocumentRegistryBundle([DOC])
    expect(bundle.schema).toBe('motopass-document-registry/v1')
    expect(bundle.issuer).toBe('MotoPass document registry')
    expect(bundle.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(bundle.build).toBeTruthy()
    expect(bundle.build_label).toBeTruthy()

    const doc = bundle.documents[0]
    expect(doc.hash).toBe('a1'.repeat(32))
    expect(doc.stamp_id).toBe('uuid-1')
    expect(doc.status).toBe('confirmed')
    expect(doc.block_height).toBe(958093)
    expect(doc.verify_url).toBe(`https://satohash.io/verify/${'a1'.repeat(32)}`)
  })

  it('passes pending and error statuses through honestly', () => {
    const bundle = buildDocumentRegistryBundle([
      { ...DOC, id: 'p1', status: 'pending', stampId: undefined, blockHeight: null },
      { ...DOC, id: 'e1', status: 'error', note: 'API unreachable' },
    ])
    expect(bundle.documents.map(d => d.status)).toEqual(['pending', 'error'])
    expect(bundle.documents[1].note).toBe('API unreachable')
    // pending with no stamp id still gets its verify url (hash-based)
    expect(bundle.documents[0].verify_url).toBe(`https://satohash.io/verify/${'a1'.repeat(32)}`)
  })

  it('serializes to parseable JSON with the schema intact', () => {
    const json = documentRegistryBackupJson([DOC])
    const parsed = JSON.parse(json) as DocumentRegistryBundle
    expect(parsed.schema).toBe('motopass-document-registry/v1')
    expect(parsed.documents).toHaveLength(1)
    expect(parsed.documents[0].verify_url).toContain('satohash.io/verify/')
  })
})
