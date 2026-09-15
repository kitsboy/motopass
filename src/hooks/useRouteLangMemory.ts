import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { getRouteLang, saveRouteLang } from '../i18n/routeLangStorage'

/** Remember language per route in localStorage (`motopass-lang-by-route`). */
export function useRouteLangMemory() {
  const { pathname } = useLocation()
  const { langPreference, setLang, setRoutePath } = useI18n()
  const langRef = useRef(langPreference)

  // Keep the ref current outside render — refs must never be written during render.
  useEffect(() => {
    langRef.current = langPreference
  }, [langPreference])

  useEffect(() => {
    setRoutePath(pathname)
  }, [pathname, setRoutePath])

  // Restore the language remembered for this route.
  useEffect(() => {
    const saved = getRouteLang(pathname)
    if (saved && saved !== langRef.current) {
      setLang(saved)
    }
  }, [pathname, setLang])

  // Remember it whenever it changes (or the route does).
  //
  // This MUST NOT be an unmount cleanup. Picking a language whose dictionary is
  // still a lazy chunk makes I18nProvider render <I18nLoading /> for a beat, which
  // unmounts this hook — a cleanup would then write the PRE-switch value to the
  // route map, and the restore effect above would apply it on remount, silently
  // reverting the user's choice. Measured before this fix (probe on the production
  // build): pick العربية → lang=ar/dir=rtl at 0 ms, pref back to "system" at
  // ~400 ms, lang=en/dir=ltr at ~600 ms — i.e. the switch was undone half a second
  // after the click, which is also why the RTL smoke test flapped.
  useEffect(() => {
    saveRouteLang(pathname, langPreference)
  }, [pathname, langPreference])
}
