import { Bitcoin } from 'lucide-react'
import { formatBtc, formatUsdCompact } from '../lib/btcPrice'
import { useBtcPrice } from '../context/BtcPriceContext'
import { useI18n } from '../i18n/I18nContext'

export function BtcPriceTicker({ variant = 'default' }: { variant?: 'default' | 'hero' }) {
  const { rate, loading, error, retry } = useBtcPrice()
  const { t } = useI18n()
  const isHero = variant === 'hero'
  const spot = `${formatBtc(1)} · ${formatUsdCompact(rate)}`

  return (
    <div
      className={
        isHero
          ? 'inline-flex items-center gap-1.5 text-[10px] font-mono rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-mp-on-hero-secondary backdrop-blur-sm'
          : 'nav-btn !font-mono !text-[10px] !gap-1 !px-2 !py-0 text-ink-secondary'
      }
      title={error ? t('btcPrice.fallback') : undefined}
    >
      <Bitcoin size={12} className="text-btc-orange" />
      <span>{t('btcPrice.label')}</span>
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