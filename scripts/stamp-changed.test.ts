import { describe, expect, it } from 'vitest'
import { isRateLimitMessage, rateLimitStep } from './stamp-changed.mjs'

describe('stamp rate limit', () => {
  it('retries the same program inside the job, then continues', () => {
    expect(isRateLimitMessage('Satohash stamp HTTP 429: slow down')).toBe(true)
    expect(isRateLimitMessage('Satohash stamp HTTP 500: down')).toBe(false)
    expect(rateLimitStep(0, 3, 90000)).toEqual({ action: 'retry', waitMs: 90000 })
    expect(rateLimitStep(2, 3, 90000)).toEqual({ action: 'retry', waitMs: 270000 })
    expect(rateLimitStep(3, 3, 90000)).toEqual({ action: 'continue' })
  })
})
