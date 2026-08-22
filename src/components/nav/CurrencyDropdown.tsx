import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bitcoin, Check, ChevronDown, Coins, RefreshCw, TriangleAlert } from 'lucide-react'
import { useDisplayCurrency } from '../../context/DisplayCurrencyContext'
import { useI18n } from '../../i18n/I18nContext'
import { FIATS, type DisplayCurrency } from '../../lib/fx'

const PANEL_WIDTH = 212

type MenuPos = { top: number; left: number; width: number }

const SATS_LABEL = 'sats'

function symbolFor(c: DisplayCurrency): string {
  if (c === 'SAT') return 'sats'
  if (c === 'BTC') return '₿'
  return FIATS.find((f) => f.code === c)?.symbol ?? c
}

export function CurrencyDropdown({ size = 'compact' }: { size?: 'compact' | 'menu' }) {
  const { currency, setCurrency, suggested, fx, fxDegraded } = useDisplayCurrency()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const rows: Array<{ kind: 'btc' | 'sat' | 'sep' | 'fiat' | 'suggest'; code?: string }> = []
  if (suggested && suggested !== currency) rows.push({ kind: 'suggest', code: suggested })
  rows.push({ kind: 'sat' })
  rows.push({ kind: 'btc' })
  rows.push({ kind: 'sep' })
  for (const f of FIATS) rows.push({ kind: 'fiat', code: f.code })
  const optionCount = rows.length

  const pick = (c: DisplayCurrency) => {
    setCurrency(c)
    setOpen(false)
  }

  const updateMenuPos = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const width = size === 'menu' ? rect.width : PANEL_WIDTH
    const left = size === 'menu' ? rect.left : Math.min(rect.right - width, window.innerWidth - width - 8)
    setMenuPos({ top: rect.bottom + 6, left: Math.max(8, left), width })
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
        setHighlight((i) => (i + 1) % optionCount)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((i) => (i - 1 + optionCount) % optionCount)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const row = rows[highlight]
        if (!row) return
        if (row.kind === 'sat') pick('SAT')
        else if (row.kind === 'btc') pick('BTC')
        else if (row.kind === 'fiat' && row.code) pick(row.code as DisplayCurrency)
        else if (row.kind === 'suggest' && row.code) pick(row.code as DisplayCurrency)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, highlight, optionCount, rows])

  const isFiat = currency !== 'BTC' && currency !== 'SAT'
  const staleActive = isFiat && (fx?.stale ?? false)
  const missingActive = isFiat && (fx?.missing ?? false)

  const triggerClass =
    size === 'menu'
      ? 'nav-btn w-full justify-between !px-3'
      : 'nav-btn !gap-1 !pl-2 !pr-1.5 min-w-[2.75rem] md:min-w-[4.75rem]'

  const panel =
    open && menuPos
      ? createPortal(
          <ul
            ref={panelRef}
            id={listId}
            role="listbox"
            aria-label={t('currency.label')}
            className="nav-dropdown-panel nav-dropdown-portal"
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          >
            <li className="px-2.5 py-1.5 border-b border-mp/60 flex items-center gap-1.5 text-[10px] font-chrome uppercase tracking-wider text-ink-muted">
              <Coins size={11} aria-hidden="true" />
              {t('currency.label')}
              {fxDegraded && (
                <span className="ml-auto flex items-center gap-1 text-[9px] normal-case text-amber-300/90" title={t('currency.degradedTitle')}>
                  <RefreshCw size={9} aria-hidden="true" /> {t('currency.staleTag')}
                </span>
              )}
            </li>

            {rows.map((row, idx) => {
              if (row.kind === 'sep') {
                return <li key={`sep-${idx}`} className="mx-2 border-b border-mp/50" aria-hidden="true" />
              }
              if (row.kind === 'suggest' && row.code) {
                const active = currency === row.code
                return (
                  <li key="suggest" role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => pick(row.code as DisplayCurrency)}
                      onMouseEnter={() => setHighlight(idx)}
                      className={`nav-dropdown-item w-full ${highlight === idx && !active ? 'bg-section/70' : ''}`}
                    >
                      <span className="w-6 text-center text-base leading-none" aria-hidden="true">
                        {FIATS.find((f) => f.code === row.code)?.symbol}
                      </span>
                      <span className="flex-1 text-left min-w-0">
                        <span className="block font-chrome text-[11px] font-medium text-ink truncate">
                          {FIATS.find((f) => f.code === row.code)?.name}
                        </span>
                        <span className="block font-chrome text-[10px] text-ink-muted truncate">
                          {t('currency.suggested')}
                        </span>
                      </span>
                      {active && <Check size={14} className="shrink-0 text-mp-btc-text" aria-hidden="true" />}
                    </button>
                  </li>
                )
              }
              if (row.kind === 'sat' || row.kind === 'btc') {
                const code: DisplayCurrency = row.kind === 'sat' ? 'SAT' : 'BTC'
                const active = currency === code
                const label = row.kind === 'sat' ? SATS_LABEL : '₿ BTC'
                return (
                  <li key={code} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => pick(code)}
                      onMouseEnter={() => setHighlight(idx)}
                      className={`nav-dropdown-item w-full ${active ? 'nav-dropdown-item-active' : ''} ${highlight === idx && !active ? 'bg-section/70' : ''}`}
                    >
                      <span className="w-6 text-center text-base leading-none shrink-0" aria-hidden="true">
                        {row.kind === 'sat' ? <Coins size={15} className="inline text-mp-btc-text" /> : <Bitcoin size={15} className="inline text-btc-orange" />}
                      </span>
                      <span className="flex-1 text-left min-w-0">
                        <span className="block font-chrome text-[11px] font-medium text-ink truncate">{label}</span>
                        <span className="block font-chrome text-[10px] text-ink-muted truncate">
                          {row.kind === 'sat' ? t('currency.btcFirstDefault') : t('currency.wholeBtc')}
                        </span>
                      </span>
                      {active && <Check size={14} className="shrink-0 text-mp-btc-text" aria-hidden="true" />}
                    </button>
                  </li>
                )
              }
              const meta = FIATS.find((f) => f.code === row.code)
              if (!meta) return null
              const active = currency === meta.code
              const fiatFx = fx?.currency === meta.code ? fx : null
              return (
                <li key={meta.code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => pick(meta.code as DisplayCurrency)}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`nav-dropdown-item w-full ${active ? 'nav-dropdown-item-active' : ''} ${highlight === idx && !active ? 'bg-section/70' : ''}`}
                  >
                    <span className="w-6 text-center text-base leading-none shrink-0" aria-hidden="true">
                      {meta.symbol}
                    </span>
                    <span className="flex-1 text-left min-w-0">
                      <span className="block font-chrome text-[11px] font-medium text-ink truncate">{meta.name}</span>
                      <span className="block font-chrome text-[10px] text-ink-muted truncate">
                        {active && fiatFx?.missing
                          ? t('currency.fxUnavailable')
                          : active && fiatFx?.stale
                            ? t('currency.staleTag')
                            : t('currency.liveRate')}
                      </span>
                    </span>
                    {active && (fiatFx?.missing ? <TriangleAlert size={13} className="shrink-0 text-amber-300" aria-hidden="true" /> : fiatFx?.stale ? <RefreshCw size={12} className="shrink-0 text-amber-300/90" aria-hidden="true" /> : <Check size={14} className="shrink-0 text-mp-btc-text" aria-hidden="true" />)}
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
        onClick={() => setOpen((v) => !v)}
        title={`${t('currency.label')} — ${t('currency.btcFirstDefault')}`}
        data-currency-trigger
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-base leading-none shrink-0" aria-hidden="true">
            {currency === 'SAT' ? (
              <Coins size={14} className="text-mp-btc-text" />
            ) : currency === 'BTC' ? (
              <Bitcoin size={14} className="text-btc-orange" />
            ) : (
              <span className="text-[13px] font-semibold">{FIATS.find((f) => f.code === currency)?.symbol}</span>
            )}
          </span>
          {(size === 'menu' || size === 'compact') && (
            <span
              className={`truncate text-left font-chrome text-[11px] text-ink-secondary ${
                size === 'compact' ? 'hidden md:inline max-w-[3.5rem]' : ''
              }`}
            >
              {symbolFor(currency)}
            </span>
          )}
          {staleActive && !missingActive && <RefreshCw size={10} className="shrink-0 text-amber-300/90" aria-hidden="true" />}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        <span className="sr-only">
          {t('currency.label')}: {symbolFor(currency)}
        </span>
      </button>
      {panel}
    </div>
  )
}
