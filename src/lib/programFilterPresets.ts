import { DEFAULT_FILTERS, type ProgramFilters } from './programFilter'

export type FilterPresetId = 'under100k' | 'lightning' | 'bitcoinFriendly'

export const FILTER_PRESET_PATCH: Record<FilterPresetId, Partial<ProgramFilters>> = {
  under100k: { maxInvestment: 100_000 },
  lightning: { lightningOnly: true },
  bitcoinFriendly: { minCryptoScore: 7 },
}

export function isFilterPresetActive(id: FilterPresetId, filters: ProgramFilters): boolean {
  switch (id) {
    case 'under100k':
      return filters.maxInvestment <= 100_000 && filters.maxInvestment < DEFAULT_FILTERS.maxInvestment
    case 'lightning':
      return filters.lightningOnly
    case 'bitcoinFriendly':
      return filters.minCryptoScore >= 7
    default:
      return false
  }
}

export function toggleFilterPreset(
  id: FilterPresetId,
  filters: ProgramFilters,
): Partial<ProgramFilters> {
  if (isFilterPresetActive(id, filters)) {
    switch (id) {
      case 'under100k':
        return { maxInvestment: DEFAULT_FILTERS.maxInvestment }
      case 'lightning':
        return { lightningOnly: false }
      case 'bitcoinFriendly':
        return { minCryptoScore: 0 }
      default:
        return {}
    }
  }
  return FILTER_PRESET_PATCH[id]
}