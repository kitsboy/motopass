import { describe, expect, it } from 'vitest'
import { anchorStatusLabel, ledgerRoot, ledgerRootInput } from './ledgerAnchor'

const A = 'a'.repeat(64)
const B = 'b'.repeat(64)
const C = 'c'.repeat(64)

describe('ledgerRootInput', () => {
  it('sorts, de-duplicates and lowercases ids', () => {
    expect(ledgerRootInput([B, A, A.toUpperCase(), B])).toBe(`${A}\n${B}`)
  })

  it('drops anything that is not a 64-hex event id', () => {
    expect(ledgerRootInput(['deadbeef', '', A])).toBe(A)
    expect(ledgerRootInput([])).toBeNull()
    expect(ledgerRootInput(['not-an-id'])).toBeNull()
  })
})

describe('ledgerRoot', () => {
  it('is deterministic and independent of input order', async () => {
    const one = await ledgerRoot([A, B, C])
    const two = await ledgerRoot([C, A, B, B])
    expect(one).toMatch(/^[a-f0-9]{64}$/)
    expect(one).toBe(two)
  })

  it('changes when the set changes', async () => {
    expect(await ledgerRoot([A, B])).not.toBe(await ledgerRoot([A, C]))
  })

  it('returns null instead of hashing an empty set', async () => {
    expect(await ledgerRoot([])).toBeNull()
  })
})

describe('anchorStatusLabel', () => {
  it('calls a block height proof', () => {
    expect(anchorStatusLabel(912_345, 'confirmed')).toBe('Bitcoin block 912345')
  })

  it('does not turn a confirmed status into a height', () => {
    expect(anchorStatusLabel(null, 'confirmed')).toBe('confirmed — block height not reported')
  })

  it('keeps pending and failed apart', () => {
    expect(anchorStatusLabel(null, 'pending')).toBe('pending — waiting for Bitcoin')
    expect(anchorStatusLabel(null, null)).toBe('pending — waiting for Bitcoin')
    expect(anchorStatusLabel(null, 'failed')).toBe('stamp failed')
  })
})
