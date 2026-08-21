import { describe, expect, it } from 'vitest'
import { applyStampPayload, normalizeDocHashes } from './stampPayload'

describe('stampPayload', () => {
  it('apply payload omits name and notes', () => {
    const payload = applyStampPayload({
      program: 'Uruguay',
      created: '2026-08-18T00:00:00.000Z',
      npub: 'npub1abc',
      proofHash: 'aa'.repeat(32),
    })
    const json = JSON.stringify(payload)
    expect(json).not.toMatch(/applicant|notes|name/i)
    expect(payload.program).toBe('Uruguay')
    expect(payload.kind).toBe('application-interest')
    expect(payload.proof).toBe('aa'.repeat(32))
  })

  it('apply payload with no docs emits docs: null', () => {
    const payload = applyStampPayload({
      program: 'Uruguay',
      created: '2026-08-18T00:00:00.000Z',
    })
    expect(payload.docs).toBeNull()
  })

  it('apply payload attaches doc hashes sorted, deduped, lowercase — never filenames', () => {
    const a = 'aa'.repeat(32)
    const b = 'bb'.repeat(32)
    const payload = applyStampPayload({
      program: 'Uruguay',
      created: '2026-08-18T00:00:00.000Z',
      docHashes: [`${b.toUpperCase()}`, a, b, 'not-a-hash', 'passport.pdf'],
    })
    expect(payload.docs).toEqual([a, b])
    const json = JSON.stringify(payload)
    expect(json).not.toMatch(/passport|\.pdf|filename/i)
  })

  it('normalizeDocHashes filters invalid and dedupes', () => {
    expect(normalizeDocHashes(['AA'.repeat(32), 'AA'.repeat(32), 'zz', ''])).toEqual(['aa'.repeat(32)])
    expect(normalizeDocHashes(undefined)).toEqual([])
    expect(normalizeDocHashes(null)).toEqual([])
  })

})
