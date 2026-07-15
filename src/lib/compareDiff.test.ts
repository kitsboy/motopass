import { describe, expect, it } from 'vitest'
import { compareDiffClass, compareDiffKind } from './compareDiff'

describe('compareDiff', () => {
  it('classifies diff kinds', () => {
    expect(compareDiffKind('100', '100', false, false)).toBe('same')
    expect(compareDiffKind('50', '100', true, true)).toBe('added')
    expect(compareDiffKind('', '100', false, true)).toBe('removed')
    expect(compareDiffKind('80', '100', false, true)).toBe('changed')
  })

  it('maps kinds to css classes', () => {
    expect(compareDiffClass('added')).toBe('compare-diff-added')
    expect(compareDiffClass('removed')).toBe('compare-diff-removed')
    expect(compareDiffClass('changed')).toBe('compare-diff-changed')
    expect(compareDiffClass('same')).toBe('')
  })
})