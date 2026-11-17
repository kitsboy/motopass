import { describe, expect, it } from 'vitest'
import { foreignChanges, porcelainPath } from './guard-quote-status-pr.mjs'

describe('quote-status porcelain parser', () => {
  it('keeps the first letter of an unstaged path', () => {
    expect(porcelainPath(' M src/data/quoteStatus.json')).toBe('src/data/quoteStatus.json')
    expect(porcelainPath(' M research/quote-check.json')).toBe('research/quote-check.json')
  })

  it('the trim-then-strip parse is the bug the nightly reported', () => {
    const lines = [' M research/quote-check.json', ' M src/data/quoteStatus.json']
    const old = lines.map((l) => l.trim().replace(/^.../, ''))
    expect(old).toEqual(['esearch/quote-check.json', 'rc/data/quoteStatus.json'])
    expect(foreignChanges(lines.join('\n'))).toEqual(['research/quote-check.json'])
  })

  it('treats a quoteStatus-only diff as clean', () => {
    expect(foreignChanges(' M src/data/quoteStatus.json\n')).toEqual([])
  })
})
