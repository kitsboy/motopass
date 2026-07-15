import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS } from './programFilter'
import {
  activeFilterPresetsFromFilters,
  applyFilterPresets,
  isFilterPresetActive,
  loadSessionFilterPresets,
  saveSessionFilterPresets,
  toggleFilterPreset,
} from './programFilterPresets'

const sessionStorage: Record<string, string> = {}

beforeEach(() => {
  Object.keys(sessionStorage).forEach((k) => delete sessionStorage[k])
  globalThis.sessionStorage = {
    getItem: (k: string) => sessionStorage[k] ?? null,
    setItem: (k: string, v: string) => { sessionStorage[k] = v },
    removeItem: (k: string) => { delete sessionStorage[k] },
    clear: () => Object.keys(sessionStorage).forEach((k) => delete sessionStorage[k]),
    key: () => null,
    length: 0,
  }
})

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

  it('persists lightning preset in session storage', () => {
    saveSessionFilterPresets(['lightning'])
    expect(loadSessionFilterPresets()).toEqual(['lightning'])
    const next = applyFilterPresets(DEFAULT_FILTERS, ['lightning'])
    expect(next.lightningOnly).toBe(true)
    expect(activeFilterPresetsFromFilters(next)).toContain('lightning')
  })
})