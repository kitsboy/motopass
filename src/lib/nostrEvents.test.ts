import { describe, it, expect } from 'vitest'
import {
  buildProgramProofEvent,
  buildTimestampAttestationEvent,
} from './nostrEvents'

describe('nostrEvents timestamp tags', () => {
  it('program proof events carry satohash, hash, block, and ots tags', () => {
    const event = buildProgramProofEvent('Uruguay', 'OTS on disk', {
      field: 'details',
      content_hash: 'ab'.repeat(32),
      block_height: 901000,
      proof_url: 'https://satohash.io/verify/proof-1',
      ots_path: '/proofs/uruguay.ots',
      proof_status: 'verified',
    })
    const tags = Object.fromEntries(event.tags.filter(t => t[0] !== 't').map(t => [t[0], t[1]]))
    expect(event.kind).toBe(30078)
    expect(tags.d).toBe('motopass-program-uruguay')
    expect(tags.satohash).toBe('https://satohash.io/verify/proof-1')
    expect(tags.hash).toBe('ab'.repeat(32))
    expect(tags.block).toBe('901000')
    expect(tags.ots).toBe('/proofs/uruguay.ots')
    expect(JSON.parse(event.content).publish_stub).toBeUndefined()
  })

  it('timestamp attestation ties Satohash stamp id, hash, and block', () => {
    const hash = 'cd'.repeat(32)
    const event = buildTimestampAttestationEvent({
      hash,
      satohashUrl: 'https://satohash.io/verify/stamp-9',
      stampId: 'stamp-9',
      blockHeight: 902000,
      status: 'confirmed',
      filename: 'motopass-verify',
    })
    const tagPairs = event.tags
    expect(event.kind).toBe(30078)
    expect(tagPairs).toContainEqual(['d', `motopass-stamp-${hash}`])
    expect(tagPairs).toContainEqual(['t', 'timestamp'])
    expect(tagPairs).toContainEqual(['satohash', 'https://satohash.io/verify/stamp-9'])
    expect(tagPairs).toContainEqual(['hash', hash])
    expect(tagPairs).toContainEqual(['stamp-id', 'stamp-9'])
    expect(tagPairs).toContainEqual(['block', '902000'])
    const body = JSON.parse(event.content) as { kind: string; stamp_id: string }
    expect(body.kind).toBe('timestamp-attestation')
    expect(body.stamp_id).toBe('stamp-9')
  })
})
