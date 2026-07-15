import { useEffect, useRef, useState } from 'react'
import { Bitcoin } from 'lucide-react'
import { formatBtc, formatUsdCompact } from '../lib/btcPrice'
import { useBtcPrice } from '../context/BtcPriceContext'
import { useI18n } from '../i18n/I18nContext'

export function BtcPriceTicker({ variant = 'default' }: { variant?: 'default' | 'hero' | 'compact' }) {
  const { rate, loading, error, retry } = useBtcPrice()
  const { t } = useI18n()
  const isHero = variant === 'hero'
  const isCompact = variant === 'compact'
  const spot = `${formatBtc(1)} · ${formatUsdCompact(rate)}`
  const [flash, setFlash] = useState(false)
  const prevRate = useRef(rate)
  const seeded = useRef(false)

  useEffect(() => {
    if (loading) return
    if (!seeded.current) {
      seeded.current = true
      prevRate.current = rate
      return
    }
    if (prevRate.current === rate) return
    prevRate.current = rate
    setFlash(true)
    const id = window.setTimeout(() => setFlash(false), 900)
    return () => window.clearTimeout(id)
  }, [rate, loading])

  const shellClass = isHero
    ? 'inline-flex items-center gap-1.5 text-[10px] font-mono rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-mp-on-hero-secondary backdrop-blur-sm'
    : isCompact
      ? 'inline-flex items-center gap-1 text-[9px] font-mono rounded-full border border-mp/70 bg-mp-section/80 px-2 py-0.5 text-ink-secondary shrink-0'
      : 'nav-btn !font-mono !text-[10px] !gap-1 !px-2 !py-0 text-ink-secondary'

  return (
    <div
      className={`${shellClass}${flash ? ' btc-price-flash' : ''}`}
      title={error ? t('btcPrice.fallback') : spot}
      aria-label={isCompact ? `${t('btcPrice.label')} ${spot}` : undefined}
    >
      <Bitcoin size={isCompact ? 11 : 12} className="text-btc-orange shrink-0" />
      {!isCompact && <span>{t('btcPrice.label')}</span>}
      {loading ? (
        <span className={isHero ? 'text-mp-on-hero-muted' : 'text-ink-muted'}>…</span>
      ) : error ? (
        <>
          <span className={isHero ? 'font-semibold text-mp-on-hero' : 'text-ink font-semibold'}>
            {spot}
          </span>
          <button
            type="button"
            onClick={retry}
            className={`underline ${isHero ? 'text-mp-on-hero' : 'text-accent'}`}
          >
            {t('block.retry')}
          </button>
        </>
      ) : (
        <span
          className={isHero ? 'font-semibold text-mp-on-hero' : 'text-ink font-semibold'}
          aria-live="polite"
        >
          {spot}
        </span>
      )}
    </div>
  )
}