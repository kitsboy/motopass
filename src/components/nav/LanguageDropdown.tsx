import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { LANGUAGES, type LangCode } from '../../i18n/languages'
import { useI18n } from '../../i18n/I18nContext'

export function LanguageDropdown({ size = 'compact' }: { size?: 'compact' | 'menu' }) {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]

  const pick = (code: LangCode) => {
    setLang(code)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const activeIdx = LANGUAGES.findIndex(l => l.code === lang)
    setHighlight(activeIdx >= 0 ? activeIdx : 0)
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight(i => (i + 1) % LANGUAGES.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight(i => (i - 1 + LANGUAGES.length) % LANGUAGES.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        setHighlight(i => {
          setLang(LANGUAGES[i].code)
          setOpen(false)
          return i
        })
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, lang, setLang])

  const triggerClass =
    size === 'menu'
      ? 'nav-btn w-full justify-between !px-3'
      : 'nav-btn nav-btn-icon !gap-1 !pl-2 !pr-1.5 min-w-[2.75rem]'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(v => !v)}
        title={t('nav.language')}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-base leading-none" aria-hidden="true">{current.flag}</span>
          {size === 'menu' && (
            <span className="truncate text-left font-chrome text-[11px] text-ink-secondary">
              {current.nativeName}
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
        <span className="sr-only">{t('nav.language')}: {current.name}</span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('nav.language')}
          className={`nav-dropdown-panel ${size === 'menu' ? 'left-0 right-0' : 'right-0 w-52'}`}
        >
          <li className="px-2.5 py-1.5 border-b border-mp/60 flex items-center gap-1.5 text-[10px] font-chrome uppercase tracking-wider text-ink-muted">
            <Globe size={11} aria-hidden="true" />
            {t('nav.language')}
          </li>
          {LANGUAGES.map((l, idx) => {
            const active = l.code === lang
            const highlighted = idx === highlight
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => pick(l.code)}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`nav-dropdown-item w-full ${active ? 'nav-dropdown-item-active' : ''} ${highlighted && !active ? 'bg-section/70' : ''}`}
                >
                  <span className="text-base leading-none w-6 text-center" aria-hidden="true">{l.flag}</span>
                  <span className="flex-1 text-left min-w-0">
                    <span className="block font-chrome text-[11px] font-medium text-ink truncate">{l.nativeName}</span>
                    <span className="block font-chrome text-[10px] text-ink-muted truncate">{l.name}</span>
                  </span>
                  {l.dir === 'rtl' && (
                    <span className="font-mono text-[9px] text-ink-muted uppercase">RTL</span>
                  )}
                  {active && <Check size={14} className="shrink-0 text-mp-btc-text" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}