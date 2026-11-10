import { describe, expect, it } from 'vitest'
import { gapBounty, gapPlan, standingMemo, SUGGESTED_GAP_BOUNTY_SATS } from './bounties'

describe('gapBounty', () => {
  it('uses the configured address and the suggested tip', () => {
    const bounty = gapBounty('gov_fees', 'motopass@breez.tips')
    expect(bounty).toEqual({
      factKey: 'gov_fees',
      sats: SUGGESTED_GAP_BOUNTY_SATS,
      address: 'motopass@breez.tips',
      walletUri: `lightning:motopass@breez.tips?amount=${SUGGESTED_GAP_BOUNTY_SATS * 1000}`,
    })
  })

  it('refuses a placeholder address rather than requesting a fake invoice', () => {
    expect(gapBounty('gov_fees', 'motopass@...')).toBeNull()
    expect(gapBounty('gov_fees', '')).toBeNull()
  })
})

describe('gapPlan', () => {
  it('multiplies open gaps by the suggested tip', () => {
    expect(gapPlan(2)).toEqual({ missing: 2, bountySats: 5_000, monthlySats: 10_000, annualSats: 120_000 })
  })

  it('accepts a custom tip', () => {
    expect(gapPlan(3, 1_000)?.monthlySats).toBe(3_000)
  })

  it('returns nothing when there is nothing to fund', () => {
    expect(gapPlan(0)).toBeNull()
    expect(gapPlan(-1)).toBeNull()
    expect(gapPlan(1.5)).toBeNull()
    expect(gapPlan(2, 0)).toBeNull()
  })

  it('names the country and the monthly amount in the memo', () => {
    const plan = gapPlan(2)
    expect(plan).not.toBeNull()
    if (plan) expect(standingMemo('Panama', plan)).toBe('MotoPass standing gap fund: Panama 10000 sats/mo')
  })
})
