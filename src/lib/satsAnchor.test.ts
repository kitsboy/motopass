import { describe, expect, it } from 'vitest'
import {
  CAPTURE_RATE,
  anchorAgeDays,
  formatSatsExact,
  isRateStale,
  rateLine,
  rateTitle,
  satsFromUsd,
  usdFromSats,
} from './satsAnchor'

describe('satsFromUsd', () => {
  it('converts at the given rate', () => {
    expect(satsFromUsd(100, 100_000)).toBe(100_000)
    expect(satsFromUsd(1, 100_000)).toBe(1_000)
  })

  it('is exact at the capture rate, not rounded to a pretty number', () => {
    expect(satsFromUsd(1, 77_328)).toBe(1293)
    expect(satsFromUsd(0, 77_328)).toBe(0)
  })

  it('refuses a negative amount or an unusable rate', () => {
    expect(satsFromUsd(-1, 100_000)).toBeNull()
    expect(satsFromUsd(Number.NaN, 100_000)).toBeNull()
    expect(satsFromUsd(100, 0)).toBeNull()
    expect(satsFromUsd(100, -5)).toBeNull()
  })
})

describe('usdFromSats', () => {
  it('round-trips a rate within a sat', () => {
    const sats = satsFromUsd(4_999, 100_000)
    expect(sats).toBe(4_999_000)
    expect(usdFromSats(sats as number, 100_000)).toBeCloseTo(4_999, 6)
  })

  it('refuses a negative balance or a zero rate', () => {
    expect(usdFromSats(-1, 100_000)).toBeNull()
    expect(usdFromSats(1_000, 0)).toBeNull()
  })
})

describe('anchor age and wording', () => {
  it('counts whole days since capture', () => {
    expect(anchorAgeDays('2026-08-22T00:00:00Z', Date.parse('2026-09-21T00:00:00Z'))).toBe(30)
    expect(anchorAgeDays('2026-09-22T00:00:00Z', Date.parse('2026-09-21T00:00:00Z'))).toBeNull()
    expect(anchorAgeDays('not a date')).toBeNull()
  })

  it('flags a rate older than the window', () => {
    const now = Date.parse('2026-11-10T00:00:00Z')
    expect(isRateStale(CAPTURE_RATE, 30, now)).toBe(true)
    expect(isRateStale(CAPTURE_RATE, 365, now)).toBe(false)
  })

  it('names the rate, the capture date and the source', () => {
    expect(rateLine({ btcUsd: 77_328, capturedAt: '2026-08-22T19:38:45Z', source: 'coingecko' })).toBe(
      '₿1 = $77,328 · captured 2026-08-22',
    )
    const title = rateTitle({ btcUsd: 77_328, capturedAt: '2026-08-22T00:00:00Z', source: 'coingecko' }, Date.parse('2026-09-21T00:00:00Z'))
    expect(title).toContain('30 days old')
    expect(title).toContain('source: coingecko')
  })

  it('prints every sat, grouped', () => {
    expect(formatSatsExact(1_234_567)).toBe('1,234,567 sats')
    expect(formatSatsExact(Number.NaN)).toBe('—')
  })
})
