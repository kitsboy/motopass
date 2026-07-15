import { describe, it, expect } from 'vitest'
import {
  parseIdList,
  serializeIdList,
  filtersFromSearchParams,
  filtersToSearchParams,
  countActiveFilters,
  portfolioSharePath,
  portfolioShareUrl,
  decodePortfolioStackParam,
} from './urlState'
import { DEFAULT_FILTERS } from './programFilter'

describe('urlState', () => {
  it('parses and serializes id lists', () => {
    expect(parseIdList('1,4,9')).toEqual([1, 4, 9])
    expect(parseIdList('1,4,9,12,99')).toEqual([1, 4, 9, 12])
    expect(serializeIdList([2, 5])).toBe('2,5')
  })

  it('round-trips program filters via URLSearchParams', () => {
    const p = new URLSearchParams('q=uruguay&region=South%20America&lightning=1&view=card')
    const f = filtersFromSearchParams(p)
    expect(f.search).toBe('uruguay')
    expect(f.region).toBe('South America')
    expect(f.lightningOnly).toBe(true)
    expect(countActiveFilters(f)).toBeGreaterThan(0)
    const out = filtersToSearchParams(f, 'card')
    expect(out.get('q')).toBe('uruguay')
    expect(out.get('view')).toBe('card')
  })

  it('returns defaults for empty params', () => {
    const f = filtersFromSearchParams(new URLSearchParams())
    expect(f.region).toBe(DEFAULT_FILTERS.region)
    expect(countActiveFilters(f)).toBe(0)
  })

  it('builds portfolio share URLs with base64 JSON', () => {
    expect(portfolioSharePath([])).toBe('/portfolio')
    const path = portfolioSharePath([3, 7])
    expect(path.startsWith('/portfolio?stack=')).toBe(true)
    const encoded = path.split('=')[1] ?? ''
    expect(decodePortfolioStackParam(encoded)).toEqual([3, 7])
    expect(portfolioShareUrl([3], 'https://motopass.test')).toContain('https://motopass.test/portfolio?stack=')
  })

  it('decodes legacy comma stack params', () => {
    expect(decodePortfolioStackParam('3,7,9')).toEqual([3, 7, 9])
  })
})