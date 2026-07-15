import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS } from './programFilter'
import { isFilterPresetActive, toggleFilterPreset } from './programFilterPresets'

describe('programFilterPresets', () => {
  it('detects active presets', () => {
    expect(isFilterPresetActive('under100k', { ...DEFAULT_FILTERS, maxInvestment: 100_000 })).toBe(true)
    expect(isFilterPresetActive('lightning', { ...DEFAULT_FILTERS, lightningOnly: true })).toBe(true)
    expect(isFilterPresetActive('bitcoinFriendly', { ...DEFAULT_FILTERS, minCryptoScore: 7 })).toBe(true)
  })

  it('toggles presets on and off', () => {
    expect(toggleFilterPreset('under100k', DEFAULT_FILTERS)).toEqual({ maxInvestment: 100_000 })
    expect(
      toggleFilterPreset('under100k', { ...DEFAULT_FILTERS, maxInvestment: 100_000 }),
    ).toEqual({ maxInvestment: DEFAULT_FILTERS.maxInvestment })
  })
})