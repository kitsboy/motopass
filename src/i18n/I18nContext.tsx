import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANG, LANGUAGES, type LangCode } from './languages'
import { t, type TranslationKey } from './translations'

interface I18nContextValue {
  lang: LangCode
  setLang: (code: LangCode) => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
}

const I18nContext = createContext<I18nContextValue | null>(null)
const STORAGE_KEY = 'motopass-lang'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null
    return saved && LANGUAGES.some(l => l.code === saved) ? saved : DEFAULT_LANG
  })

  const setLang = (code: LangCode) => {
    setLangState(code)
    localStorage.setItem(STORAGE_KEY, code)
  }

  const meta = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = meta.dir
  }, [lang, meta.dir])

  const value = useMemo<I18nContextValue>(() => ({
    lang,
    setLang,
    t: (key) => t(lang, key),
    dir: meta.dir,
  }), [lang, meta.dir])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}