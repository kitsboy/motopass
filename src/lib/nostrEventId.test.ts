import { describe, it, expect } from 'vitest'
import { nostrEventIdStub } from './nostrEventId'
import { buildProgramProofEvent } from './nostrEvents'

describe('nostrEventId', () => {
  it('returns stable 64-char hex event id stub', () => {
    const event = buildProgramProofEvent('Uruguay', 'test', {
      field: 'details',
      content_hash: 'a'.repeat(64),
    })
    const id = nostrEventIdStub(event)
    expect(id).toMatch(/^[a-f0-9]{64}$/)
    expect(nostrEventIdStub(event)).toBe(id)
  })
})