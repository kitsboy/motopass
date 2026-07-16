import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Globe, Monitor } from 'lucide-react'
import { LANGUAGES, detectBrowserLang, type LangPreference } from '../../i18n/languages'
import { useI18n } from '../../i18n/I18nContext'
import { loadRecentLangs, rememberRecentLang } from '../../i18n/recentLangStorage'
import { LazyFlag } from './LazyFlag'

const PANEL_WIDTH = 208

type MenuPos = { top: number; left: number; width: number }

export function LanguageDropdown({ size = 'compact' }: { size?: 'compact' | 'menu' }) {
  const { lang, langPreference, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const optionCount = LANGUAGES.length + 1
  const systemDetected = detectBrowserLang()
  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]
  const usingSystem = langPreference === 'system'

  const recentLangs = loadRecentLangs()

  const pick = (pref: LangPreference) => {
    if (pref !== 'system') rememberRecentLang(pref)
    setLang(pref)
    setOpen(false)
  }

  const updateMenuPos = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const width = size === 'menu' ? rect.width : PANEL_WIDTH
    const left = size === 'menu' ? rect.left : Math.min(rect.right - width, window.innerWidth - width - 8)
    setMenuPos({
      top: rect.bottom + 6,
      left: Math.max(8, left),
      width,
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    updateMenuPos()
    window.addEventListener('resize', updateMenuPos)
    window.addEventListener('scroll', updateMenuPos, true)
    return () => {
      window.removeEventListener('resize', updateMenuPos)
      window.removeEventListener('scroll', updateMenuPos, true)
    }
  }, [open, size])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight(i => (i + 1) % optionCount)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight(i => (i - 1 + optionCount) % optionCount)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (highlight === 0) pick('system')
        else pick(LANGUAGES[highlight - 1].code)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, highlight, optionCount])

  const triggerClass =
    size === 'menu'
      ? 'nav-btn w-full justify-between !px-3'
      : 'nav-btn !gap-1 !pl-2 !pr-1.5 min-w-[2.75rem] md:min-w-[5.5rem]'

  const triggerLabel = usingSystem ? t('nav.languageSystem') : current.nativeName

  const panel =
    open && menuPos
      ? createPortal(
          <ul
            ref={panelRef}
            id={listId}
            role="listbox"
            aria-label={t('nav.language')}
            className="nav-dropdown-panel nav-dropdown-portal"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
          >
            <li className="px-2.5 py-1.5 border-b border-mp/60 flex items-center gap-1.5 text-[10px] font-chrome uppercase tracking-wider text-ink-muted">
              <Globe size={11} aria-hidden="true" />
              {t('nav.language')}
            </li>
            {recentLangs.length > 0 && (
              <>
                <li className="px-2.5 py-1 text-[9px] font-chrome uppercase tracking-wider text-ink-muted">
                  {t('nav.languageRecent')}
                </li>
                {recentLangs.map(code => {
                  const l = LANGUAGES.find(x => x.code === code)
                  if (!l) return null
                  const active = !usingSystem && l.code === lang
                  return (
                    <li key={`recent-${l.code}`} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => pick(l.code)}
                        className={`nav-dropdown-item w-full ${active ? 'nav-dropdown-item-active' : ''}`}
                      >
                        <LazyFlag flag={l.flag} eager={open} className="text-base leading-none w-6 text-center" />
                        <span className="flex-1 text-left min-w-0">
                          <span className="block font-chrome text-[11px] font-medium text-ink truncate">{l.nativeName}</span>
                        </span>
                        {active && <Check size={14} className="shrink-0 text-mp-btc-text" aria-hidden="true" />}
                      </button>
                    </li>
                  )
                })}
                <li className="mx-2 border-b border-mp/50" aria-hidden="true" />
              </>
            )}
            <li role="option" aria-selected={usingSystem}>
              <button
                type="button"
                onClick={() => pick('system')}
                onMouseEnter={() => setHighlight(0)}
                className={`nav-dropdown-item w-full ${usingSystem ? 'nav-dropdown-item-active' : ''} ${highlight === 0 && !usingSystem ? 'bg-section/70' : ''}`}
              >
                <Monitor size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />
                <span className="flex-1 text-left min-w-0">
                  <span className="block font-chrome text-[11px] font-medium text-ink truncate">
                    {t('nav.languageSystem')}
                  </span>
                  <span className="block font-chrome text-[10px] text-ink-muted truncate">
                    {LANGUAGES.find(l => l.code === systemDetected)?.nativeName ?? systemDetected}
                  </span>
                </span>
                {usingSystem && <Check size={14} className="shrink-0 text-mp-btc-text" aria-hidden="true" />}
              </button>
            </li>
            {LANGUAGES.map((l, idx) => {
              const optionIndex = idx + 1
              const active = !usingSystem && l.code === lang
              const highlighted = optionIndex === highlight
              return (
                <li key={l.code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => pick(l.code)}
                    onMouseEnter={() => setHighlight(optionIndex)}
                    className={`nav-dropdown-item w-full ${active ? 'nav-dropdown-item-active' : ''} ${highlighted && !active ? 'bg-section/70' : ''}`}
                  >
                    <LazyFlag flag={l.flag} eager={open} className="text-base leading-none w-6 text-center" />
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
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen(v => {
            if (!v) {
              if (usingSystem) setHighlight(0)
              else setHighlight(Math.max(1, LANGUAGES.findIndex(l => l.code === lang) + 1))
            }
            return !v
          })
        }}
        title={`${t('nav.language')} (${t('nav.languageShortcut')})`}
        data-language-trigger
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-base leading-none shrink-0" aria-hidden="true">
            {usingSystem ? <Monitor size={14} className="text-ink-muted" /> : <LazyFlag flag={current.flag} />}
          </span>
          {(size === 'menu' || size === 'compact') && (
            <span
              className={`truncate text-left font-chrome text-[11px] text-ink-secondary ${
                size === 'compact' ? 'hidden md:inline max-w-[4.5rem]' : ''
              }`}
            >
              {triggerLabel}
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
      {panel}
    </div>
  )
}