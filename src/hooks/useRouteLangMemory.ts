import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { getRouteLang, saveRouteLang } from '../i18n/routeLangStorage'

/** Remember language per route in localStorage (`motopass-lang-by-route`). */
export function useRouteLangMemory() {
  const { pathname } = useLocation()
  const { langPreference, setLang, setRoutePath } = useI18n()
  const langRef = useRef(langPreference)
  langRef.current = langPreference

  useEffect(() => {
    setRoutePath(pathname)
  }, [pathname, setRoutePath])

  useEffect(() => {
    const saved = getRouteLang(pathname)
    if (saved && saved !== langRef.current) {
      setLang(saved)
    }

    return () => {
      saveRouteLang(pathname, langRef.current)
    }
  }, [pathname, setLang])
}