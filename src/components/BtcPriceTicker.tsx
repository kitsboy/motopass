import { useCallback, useEffect, useRef, useState } from 'react'
import { Bitcoin } from 'lucide-react'
import { formatBtc, formatUsdCompact } from '../lib/btcPrice'
import { useBtcPrice } from '../context/BtcPriceContext'
import { useI18n } from '../i18n/I18nContext'

export function BtcPriceTicker({ variant = 'default' }: { variant?: 'default' | 'hero' | 'compact' }) {
  const { rate, loading, error, retry } = useBtcPrice()
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
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

  const copySpot = useCallback(async () => {
    if (loading || error) return
    const text = formatUsdCompact(rate)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [loading, error, rate])

  const shellClass = isHero
    ? 'inline-flex items-center gap-1.5 text-[10px] font-mono rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-mp-on-hero-secondary backdrop-blur-sm'
    : isCompact
      ? 'inline-flex items-center gap-1 text-[9px] font-mono rounded-full border border-mp/70 bg-mp-section/80 px-2 py-0.5 text-ink-secondary shrink-0'
      : 'nav-btn !font-mono !text-[10px] !gap-1 !px-2 !py-0 text-ink-secondary'

  const canCopy = !loading && !error && !isHero
  const title = copied ? t('btcPrice.copied') : error ? t('btcPrice.fallback') : canCopy ? t('btcPrice.copyHint') : spot
  const ariaLabel = `${t('btcPrice.label')} ${spot}`

  const content = (
    <>
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
          {copied ? t('btcPrice.copied') : spot}
        </span>
      )}
    </>
  )

  const className = `${shellClass}${flash ? ' btc-price-flash' : ''}${canCopy ? ' cursor-pointer hover:border-btc-orange/40' : ''}`

  if (canCopy) {
    return (
      <button
        type="button"
        onClick={copySpot}
        className={className}
        title={title}
        aria-label={ariaLabel}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={className} title={title} aria-label={isCompact ? ariaLabel : undefined}>
      {content}
    </div>
  )
}