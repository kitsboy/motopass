import { describe, expect, it } from 'vitest'
import { applyStampPayload, profileDocumentStampPayload } from './stampPayload'

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

  it('profile document payload omits filename', () => {
    const payload = profileDocumentStampPayload({
      program: 'Uruguay',
      created: '2026-08-18T00:00:00.000Z',
      contentHash: 'bb'.repeat(32),
      size: 12,
      type: 'application/pdf',
      npub: 'npub1xyz',
    })
    const json = JSON.stringify(payload)
    expect(json).not.toMatch(/filename|\.pdf/i)
    expect(payload.content_hash).toBe('bb'.repeat(32))
    expect(payload.kind).toBe('profile-document')
  })
})
