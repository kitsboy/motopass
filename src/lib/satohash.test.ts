import { describe, it, expect } from 'vitest'
import { hashApplicationPayload, satohashVerifyUrl, satohashStampGuideUrl } from './satohash'

describe('satohash', () => {
  it('hashes canonical JSON deterministically', async () => {
    const payload = { a: 1, b: 'test' }
    const h1 = await hashApplicationPayload(payload)
    const h2 = await hashApplicationPayload(payload)
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[a-f0-9]{64}$/)
  })

  it('builds verify and stamp URLs', () => {
    const hash = 'abc123'
    expect(satohashVerifyUrl(hash)).toContain(hash)
    expect(satohashStampGuideUrl(hash)).toContain(hash)
  })
})