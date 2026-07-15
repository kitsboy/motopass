import { formatDualUsd } from '../lib/btcPrice'
import { useBtcPrice } from '../context/BtcPriceContext'

type BtcDualPriceProps = {
  usd: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  layout?: 'stack' | 'inline'
  /** Show USD line (always secondary to BTC). */
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
  const { rate } = useBtcPrice()
  const dual = formatDualUsd(usd, rate)
  const sizes = sizeClasses[size]

  if (layout === 'inline') {
    return (
      <span className={`font-mono tabular-nums ${className}`}>
        <span className={`font-semibold text-mp-btc-text ${sizes.btc}`}>{dual.btc}</span>
        {showUsd && (
          <span className={`ml-1.5 text-ink-muted ${sizes.usd}`} aria-label={`${dual.usd} US dollars`}>
            · {dual.usd}
          </span>
        )}
      </span>
    )
  }

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className={`font-mono font-semibold tabular-nums text-mp-btc-text ${sizes.btc}`}>
        {dual.btc}
      </span>
      {showUsd && (
        <span className={`font-mono tabular-nums text-ink-muted ${sizes.usd}`}>
          {dual.usd}
        </span>
      )}
    </span>
  )
}