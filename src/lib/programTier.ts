import type { Program } from '../components/programs/types'
import type { TranslationKey } from '../i18n/translations'

const TIER_KEYS: Record<Program['tier'], TranslationKey> = {
  Citizenship: 'programs.tierCitizenship',
  Residency: 'programs.tierResidency',
  'Golden Visa': 'programs.tierGoldenVisa',
}

export function tierTooltipKey(tier: Program['tier']): TranslationKey {
  return TIER_KEYS[tier]
}