import { describe, it, expect } from 'vitest'
import { bytesToHex, checkPreimage, hexToBytes, sha256Hex } from './preimage'

/** SHA-256 of 32 zero bytes — a fixed vector, not computed by the code under test. */
const ZERO_PREIMAGE = '00'.repeat(32)
const ZERO_HASH = '66687aadf862bd776c8fc18b8e9f8e20089714856ee233b3902a591d0d5f2925'

describe('sha256Hex', () => {
  it('hashes a 32-byte preimage to its known digest', async () => {
    expect(await sha256Hex(ZERO_PREIMAGE)).toBe(ZERO_HASH)
  })

  it('refuses malformed hex instead of hashing part of it', async () => {
    expect(await sha256Hex('abc')).toBeNull()
    expect(await sha256Hex(`${'00'.repeat(31)}zz`)).toBeNull()
    expect(hexToBytes('abc')).toBeNull()
  })
})

describe('hex helpers', () => {
  it('round-trip bytes and hex', () => {
    const bytes = hexToBytes(ZERO_PREIMAGE)
    expect(bytes).not.toBeNull()
    expect(bytesToHex(bytes as Uint8Array)).toBe(ZERO_PREIMAGE)
  })
})

describe('checkPreimage', () => {
  it('matches the hash of the same preimage', async () => {
    expect(await checkPreimage(ZERO_PREIMAGE, ZERO_HASH)).toBe('match')
  })

  it('reports a mismatch for a different preimage', async () => {
    expect(await checkPreimage('11'.repeat(32), ZERO_HASH)).toBe('mismatch')
  })

  it('reports unreadable rather than guessing', async () => {
    expect(await checkPreimage('not-a-preimage', ZERO_HASH)).toBe('unreadable')
    expect(await checkPreimage(ZERO_PREIMAGE, 'short')).toBe('unreadable')
  })
})
