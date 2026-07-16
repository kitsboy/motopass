import { useBtcPrice } from '../../context/BtcPriceContext'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { formatBtc, formatUsdCompact } from '../../lib/btcPrice'

/** Hero subline with subtle live BTC spot price (item 821). */
export function PitchHeroSubline() {
  const { t } = useI18n()
  const { rate, loading } = useBtcPrice()

  return (
    <p className="mt-6 max-w-lg font-body text-lg2 text-mp-on-hero-secondary drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)] leading-relaxed">
      {t('pitch.sub')}
      <span
        className="mt-2 block font-mono text-sm text-mp-btc/85 tabular-nums"
        aria-live="polite"
      >
        {loading
          ? '…'
          : formatT(t, 'pitch.hero.spot', {
              btc: formatBtc(1),
              usd: formatUsdCompact(rate),
            })}
      </span>
    </p>
  )
}