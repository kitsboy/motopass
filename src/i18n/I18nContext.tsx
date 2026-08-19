import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { LANGUAGES, detectBrowserLang, type LangCode, type LangPreference } from './languages'
import { saveRouteLang } from './routeLangStorage'
import { TRANSLATIONS, t as translate, type TranslationKey } from './translations'

interface I18nContextValue {
  lang: LangCode
  langPreference: LangPreference
  setLang: (pref: LangPreference) => void
  setRoutePath: (path: string) => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
}

const I18nContext = createContext<I18nContextValue | null>(null)
const STORAGE_KEY = 'motopass-lang'

function readPreference(): LangPreference {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'system') return 'system'
  if (saved && LANGUAGES.some(l => l.code === saved)) return saved as LangCode
  return 'system'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [langPreference, setLangPreference] = useState<LangPreference>(readPreference)
  const routePathRef = useRef('/')

  const lang: LangCode =
    langPreference === 'system' ? detectBrowserLang() : langPreference

  const setRoutePath = useCallback((path: string) => {
    routePathRef.current = path
  }, [])

  const setLang = useCallback((pref: LangPreference) => {
    setLangPreference(pref)
    localStorage.setItem(STORAGE_KEY, pref)
    saveRouteLang(routePathRef.current, pref)
  }, [])

  const meta = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = meta.dir
  }, [lang, meta.dir])

  const value = useMemo<I18nContextValue>(() => ({
    lang,
    langPreference,
    setLang,
    setRoutePath,
    t: (key) => {
      const dict = TRANSLATIONS[lang]
      const enDict = TRANSLATIONS.en
      if (import.meta.env.DEV && dict[key] === undefined && enDict[key] === undefined) {
        console.warn(`[i18n] Missing translation key: "${key}" (lang: ${lang})`)
      }
      return translate(lang, key)
    },
    dir: meta.dir,
  }), [lang, langPreference, setLang, setRoutePath, meta.dir])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

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