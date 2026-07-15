import { DEFAULT_FILTERS, type ProgramFilters } from './programFilter'

export type FilterPresetId = 'under100k' | 'lightning' | 'bitcoinFriendly'

const PRESET_SESSION_KEY = 'motopass-filter-presets'

export const FILTER_PRESET_IDS: FilterPresetId[] = ['under100k', 'lightning', 'bitcoinFriendly']

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

/** Active preset chips for this browser tab session (e.g. Lightning-ready). */
export function loadSessionFilterPresets(): FilterPresetId[] {
  try {
    const raw = sessionStorage.getItem(PRESET_SESSION_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is FilterPresetId => FILTER_PRESET_IDS.includes(id as FilterPresetId))
  } catch {
    return []
  }
}

export function saveSessionFilterPresets(ids: FilterPresetId[]) {
  sessionStorage.setItem(PRESET_SESSION_KEY, JSON.stringify(ids))
}

export function activeFilterPresetsFromFilters(filters: ProgramFilters): FilterPresetId[] {
  return FILTER_PRESET_IDS.filter((id) => isFilterPresetActive(id, filters))
}

export function applyFilterPresets(filters: ProgramFilters, presets: FilterPresetId[]): ProgramFilters {
  let next = { ...filters }
  for (const id of presets) {
    next = { ...next, ...FILTER_PRESET_PATCH[id] }
  }
  return next
}

/** One-click apply Lightning-ready preset (does not toggle off). */
export function applyLightningPreset(filters: ProgramFilters): ProgramFilters {
  return { ...filters, lightningOnly: true }
}