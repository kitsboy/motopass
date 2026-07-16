import { describe, it, expect } from 'vitest'
import { distressedFiltersFromSearchParams, distressedFiltersToSearchParams } from './distressedUrlState'

describe('distressedUrlState', () => {
  it('parses price filter range from URL', () => {
    const params = new URLSearchParams('region=Europe&minScore=3&maxAsk=100000')
    expect(distressedFiltersFromSearchParams(params)).toEqual({
      region: 'Europe',
      minScore: 3,
      maxBtcUsd: 100_000,
    })
  })

  it('writes filters to URL', () => {
    const out = distressedFiltersToSearchParams(
      { region: 'Asia', minScore: 4, maxBtcUsd: 50_000, proofGatedOnly: false, bookmarksOnly: false },
      new URLSearchParams('sort=price'),
    )
    expect(out.get('region')).toBe('Asia')
    expect(out.get('minScore')).toBe('4')
    expect(out.get('maxAsk')).toBe('50000')
    expect(out.get('sort')).toBe('price')
  })

  it('clears default filter params', () => {
    const out = distressedFiltersToSearchParams(
      { region: 'all', minScore: 1, maxBtcUsd: 0, proofGatedOnly: false, bookmarksOnly: false },
      new URLSearchParams('region=Asia&minScore=2&maxAsk=50000'),
    )
    expect(out.get('region')).toBeNull()
    expect(out.get('minScore')).toBeNull()
    expect(out.get('maxAsk')).toBeNull()
  })
})