import { describe, it, expect } from 'vitest'
import { formatBtc, formatDualUsd, usdToBtc, usdToSats } from './btcPrice'

describe('btcPrice', () => {
  const rate = 100_000

  it('converts USD to BTC and sats', () => {
    expect(usdToBtc(150_000, rate)).toBe(1.5)
    expect(usdToSats(150_000, rate)).toBe(150_000_000)
  })

  it('formats dual with BTC first', () => {
    const dual = formatDualUsd(150_000, rate)
    expect(dual.btc).toBe('₿1.50')
    expect(dual.usd).toBe('$150k')
  })

  it('formats small BTC amounts', () => {
    expect(formatBtc(0.024)).toMatch(/^₿0\.024/)
  })
})