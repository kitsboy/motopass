import { describe, it, expect } from 'vitest'
import { parseOtsPasteContent, verifyOtsPasteContent } from './verifyOtsPaste'

const HASH = 'a'.repeat(64)

describe('verifyOtsPaste', () => {
  it('parses hex OTS content', () => {
    const hex = `${'ab'.repeat(80)}`
    const bytes = parseOtsPasteContent(hex)
    expect(bytes?.length).toBe(80)
  })

  it('verifies structural OTS paste', () => {
    const hex = `${'cd'.repeat(64)}`
    const result = verifyOtsPasteContent(hex, HASH)
    expect(result.verified).toBe(true)
    expect(result.mode).toBe('structural')
  })

  it('rejects empty paste', () => {
    const result = verifyOtsPasteContent('', HASH)
    expect(result.verified).toBe(false)
  })
})