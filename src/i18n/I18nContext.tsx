import { createContext, useContext } from 'react'
import { t as translate, type TranslationKey } from './translations'
import type { LangCode, LangPreference } from './languages'

export interface I18nContextValue {
  lang: LangCode
  langPreference: LangPreference
  setLang: (pref: LangPreference) => void
  setRoutePath: (path: string) => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
}

/**
 * Context object + consumer hook only — the provider lives in `./I18nProvider`
 * (see the note in context/ThemeContext.tsx for why:
 * `react-refresh/only-export-components`, with consumer import paths unchanged).
 */
export const I18nContext = createContext<I18nContextValue | null>(null)

const FALLBACK_I18N: I18nContextValue = {
  lang: 'en',
  langPreference: 'system',
  setLang: () => {},
  setRoutePath: () => {},
  t: key => translate('en', key),
  dir: 'ltr',
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  // Never throw — a split chunk can see a different Context instance than the
  // provider. Fall back to English so the page still renders.
  return ctx ?? FALLBACK_I18N
}
