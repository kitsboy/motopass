import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { BlockHeight } from '../BlockHeight'
import { NostrConnect } from '../NostrConnect'
import { ThemeToggle } from '../ThemeToggle'
import { LanguageDropdown } from './LanguageDropdown'
import { CurrencyDropdown } from './CurrencyDropdown'
import { useI18n } from '../../i18n/I18nContext'

/**
 * SettingsMenu — the one utility menu.
 *
 * The old header carried a Three-bars-wide toolbar (block height, spot, Nostr,
 * theme, language, currency, demo link) competing with the nav for attention.
 * Everything a visitor can *set* now lives behind this single control; the one
 * number worth showing all the time — the Bitcoin spot price — stays visible
 * in BtcPriceTicker.
 */
export function SettingsMenu() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      // Language/currency panes render in a portal (they are not children of this
      // menu), so a click on an option must not be read as "clicked outside".
      if (target?.closest('[role="listbox"], [data-language-trigger], [data-currency-trigger], [data-dropdown-panel]')) return
      if (rootRef.current && !rootRef.current.contains(target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="nav-btn nav-btn-ghost !gap-1.5"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('nav.settings')}
        title={t('nav.settings')}
      >
        <SlidersHorizontal size={15} strokeWidth={2.25} aria-hidden />
        <span className="hidden xl:inline text-[11px]">{t('nav.settings')}</span>
        <ChevronDown size={12} aria-hidden className="opacity-70" />
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={t('nav.settings')}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[17rem] rounded-mp-lg border border-mp bg-card/98 p-3 shadow-mp-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-2 rounded-mp-md border border-mp/60 px-2.5 py-2">
            <span className="font-chrome text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {t('nav.language')}
            </span>
            <LanguageDropdown size="menu" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-mp-md border border-mp/60 px-2.5 py-2">
            <span className="font-chrome text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {t('nav.currency')}
            </span>
            <CurrencyDropdown size="menu" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-mp-md border border-mp/60 px-2.5 py-2">
            <span className="font-chrome text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {t('nav.theme')}
            </span>
            <ThemeToggle compact />
          </div>
          <div className="mt-2 rounded-mp-md border border-mp/60 px-2.5 py-2">
            <span className="mb-2 block font-chrome text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {t('nav.account')}
            </span>
            <NostrConnect />
          </div>
          <div className="mt-2 flex items-center gap-2 border-t border-mp/50 pt-2 text-[10px] font-mono text-ink-muted">
            <BlockHeight />
          </div>
        </div>
      )}
    </div>
  )
}
