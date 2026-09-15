import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LANGUAGES, detectBrowserLang, type LangCode, type LangPreference } from './languages'
import { saveRouteLang } from './routeLangStorage'
import { registerDict, t as translate, type PartialDict } from './translations'
import { loadLocale } from './locales'
import { I18nContext, type I18nContextValue } from './I18nContext'

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

  // `dictVersion` is bumped when a lazy dictionary registers. It is deliberately
  // NOT read in this callback (the translation table is a module singleton), yet
  // it must stay a dependency: `t`'s identity is what invalidates the consumer
  // memos that read it — eight pages (PitchPage, VaultPage, AgentsPage,
  // DistressedPage, FinanceComparePage, StackSimulatorPage, ProgramModal,
  // RouteSeo) memoise on `t`, so dropping this dep would leave them holding the
  // English string they computed before the locale chunk arrived. The rule
  // cannot see that, so it is silenced on the dependency line on purpose.
  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      langPreference,
      setLang,
      setRoutePath,
      t: key => translate(lang, key),
      dir: meta.dir,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the version dep is the only thing that refreshes `t` for memoising consumers
    [lang, langPreference, setLang, setRoutePath, meta.dir, dictVersion],
  )

  const ready = lang === 'en' || loadedLangs.has(lang)

  if (!ready) return <I18nLoading />

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
