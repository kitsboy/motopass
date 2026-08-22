import { RefreshCw, TriangleAlert } from 'lucide-react'
import { useDisplayCurrency } from '../context/DisplayCurrencyContext'
import { useI18n } from '../i18n/I18nContext'

type BtcDualPriceProps = {
  /** Stored USD figure — anchored to sats via btc_price_at_capture, re-priced to the active display currency. */
  usd: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  layout?: 'stack' | 'inline'
  /** Show the secondary line (always muted, BTC/sats counterpart). */
  showUsd?: boolean
  className?: string
}

const sizeClasses = {
  xs: { btc: 'text-xs', usd: 'text-[10px]' },
  sm: { btc: 'text-sm', usd: 'text-[11px]' },
  md: { btc: 'text-base', usd: 'text-xs' },
  lg: { btc: 'text-h3 font-display', usd: 'text-sm' },
}

export function BtcDualPrice({
  usd,
  size = 'sm',
  layout = 'stack',
  showUsd = true,
  className = '',
}: BtcDualPriceProps) {
  const { priceFor } = useDisplayCurrency()
  const { t } = useI18n()
  const priced = priceFor(usd)
  const sizes = sizeClasses[size]

  const staleBadge = priced.stale && (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-chrome uppercase tracking-wide text-amber-300/90"
      title={t('currency.degradedTitle')}
    >
      <RefreshCw size={8} aria-hidden="true" />
      {t('currency.staleTag')}
    </span>
  )

  const missingBadge = priced.missing && (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-chrome uppercase tracking-wide text-amber-300/90"
      title={t('currency.fxUnavailable')}
    >
      <TriangleAlert size={8} aria-hidden="true" />
      {t('currency.fxUnavailable')}
    </span>
  )

  if (layout === 'inline') {
    return (
      <span className={`font-mono tabular-nums ${className}`}>
        <span className={`font-semibold text-mp-btc-text ${sizes.btc}`}>{priced.primary}</span>
        {showUsd && priced.secondary && !priced.missing && (
          <span className={`ml-1.5 text-ink-muted ${sizes.usd}`}>· {priced.secondary}</span>
        )}
        {(priced.stale || priced.missing) && <span className="ml-1.5">{priced.stale ? staleBadge : missingBadge}</span>}
      </span>
    )
  }

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className={`font-mono font-semibold tabular-nums text-mp-btc-text ${sizes.btc}`}>
        {priced.primary}
      </span>
      {showUsd && priced.secondary && !priced.missing && (
        <span className={`font-mono tabular-nums text-ink-muted ${sizes.usd}`}>{priced.secondary}</span>
      )}
      {(priced.stale || priced.missing) && (
        <span className={`mt-0.5 font-mono ${sizes.usd}`}>{priced.stale ? staleBadge : missingBadge}</span>
      )}
    </span>
  )
}
