import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { LANGUAGES, detectBrowserLang, type LangCode, type LangPreference } from './languages'
import { saveRouteLang } from './routeLangStorage'
import { registerDict, t as translate, type PartialDict, type TranslationKey } from './translations'
import { loadLocale } from './locales'

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

/** Locales whose dictionary chunk has finished loading (English is always ready). */
const loadedLangs = new Set<LangCode>(['en'])

function readPreference(): LangPreference {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'system') return 'system'
  if (saved && LANGUAGES.some(l => l.code === saved)) return saved as LangCode
  return 'system'
}

/** Minimal, style-free loading state shown only while a non-English locale chunk loads. */
function I18nLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#16161f',
        color: '#f5f2ec',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>Loading…</p>
    </div>
  )
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [langPreference, setLangPreference] = useState<LangPreference>(readPreference)
  // Bumped (async only) when a non-English dict chunk finishes loading, so a
  // locale that arrives late re-renders into the ready state. Never set
  // synchronously in an effect body.
  const [dictVersion, setDictVersion] = useState(0)
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

  // Load the active locale's dictionary. English is bundled (no network); other
  // locales fetch their lazy chunk and register it. `ready` is derived so the
  // whole app waits for the active language before first render — no English
  // flash → no layout shift (the stutter this epic is killing).
  useEffect(() => {
    if (lang === 'en' || loadedLangs.has(lang)) return
    let active = true
    const promise = loadLocale(lang)
    if (!promise) {
      loadedLangs.add(lang)
      return
    }
    promise
      .then((dict: PartialDict) => {
        if (!active) return
        registerDict(lang, dict)
        loadedLangs.add(lang)
        setDictVersion(v => v + 1)
      })
      .catch(() => {
        // Chunk failed to load — render English rather than a blank screen.
        if (active) {
          loadedLangs.add(lang)
          setDictVersion(v => v + 1)
        }
      })
    return () => {
      active = false
    }
  }, [lang])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = meta.dir
  }, [lang, meta.dir])

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      langPreference,
      setLang,
      setRoutePath,
      t: key => translate(lang, key),
      dir: meta.dir,
    }),
    [lang, langPreference, setLang, setRoutePath, meta.dir, dictVersion],
  )

  const ready = lang === 'en' || loadedLangs.has(lang)

  if (!ready) return <I18nLoading />

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
