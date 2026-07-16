import { describe, it, expect } from 'vitest'
import { buildAgentDmCopyText, buildAgentDmNevent, stubDmEventId } from './nostrDmStub'

describe('nostrDmStub', () => {
  it('builds deterministic stub event id', () => {
    expect(stubDmEventId('uy')).toHaveLength(64)
    expect(stubDmEventId('uy')).toBe(stubDmEventId('uy'))
  })

  it('encodes nevent copy format', () => {
    const nevent = buildAgentDmNevent('uy', 'npub1motopass…uy', 'Uruguay')
    expect(nevent.startsWith('nevent1')).toBe(true)
    const copy = buildAgentDmCopyText('uy', 'npub1motopass…uy', 'Uruguay')
    expect(copy).toContain('nostr:nevent1')
    expect(copy).toContain('Uruguay')
  })
})