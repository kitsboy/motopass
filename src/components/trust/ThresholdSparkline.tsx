import { useId, useState } from 'react'
import { useBtcPrice } from '../../context/BtcPriceContext'
import { formatDualUsd, formatUsdCompact } from '../../lib/btcPrice'
import type { CountryTrustEnvelope } from '../../types/countryTrust'

/**
 * ThresholdSparkline — min_investment_usd over time, BTC-first.
 * Renders the REAL threshold history from the envelope's audit_trail. When no
 * change history exists yet (envelope seeds a single current point), it renders
 * that honestly as a one-point marker with the BTC equivalent — never invents
 * a fake trend line.
 * Hover a point to read date + USD + BTC value.
 */
export function ThresholdSparkline({
  threshold,
}: {
  threshold: CountryTrustEnvelope['threshold']
}) {
  const { rate } = useBtcPrice()
  const [active, setActive] = useState<number | null>(null)
  const id = useId()

  const points = threshold.history.length ? threshold.history : []
  const hasTrend = points.length >= 2

  const W = 260
  const H = 64
  const PAD = 6

  const usdValues = points.map((p) => p.usd).filter((v): v is number => typeof v === 'number')
  const maxUsd = usdValues.length ? Math.max(...usdValues) : (threshold.min_investment_usd ?? 0)
  const minUsd = usdValues.length ? Math.min(...usdValues) : (threshold.min_investment_usd ?? 0)
  const span = Math.max(maxUsd - minUsd, 1)

  const x = (i: number) =>
    points.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (points.length - 1)
  const y = (usd: number) => H - PAD - ((usd - minUsd) / span) * (H - PAD * 2)

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.usd).toFixed(1)}`)
    .join(' ')
  const areaPath = points.length
    ? `${linePath} L${x(points.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`
    : ''

  const activePoint = active != null ? points[active] : null

  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
          Entry threshold
        </span>
        {threshold.min_investment_usd != null && (
          <span className="font-mono text-sm font-semibold tabular-nums text-mp-btc-text">
            {formatDualUsd(threshold.min_investment_usd, rate).btc}
            <span className="ml-1.5 text-[10px] font-normal text-mp-ink-tertiary">
              {formatUsdCompact(threshold.min_investment_usd)}
            </span>
          </span>
        )}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Minimum investment threshold history"
        >
          <defs>
            <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,149,0,0.25)" />
              <stop offset="100%" stopColor="rgba(255,149,0,0.02)" />
            </linearGradient>
          </defs>

          {areaPath && <path d={areaPath} fill={`url(#${id}-area)`} />}

          {hasTrend && (
            <path
              d={linePath}
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((p, i) => {
            const px = x(i)
            const py = y(p.usd)
            return (
              <g
                key={i}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className="cursor-crosshair"
              >
                <circle
                  cx={px}
                  cy={py}
                  r={hasTrend ? 4 : 5.5}
                  fill="#f97316"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <rect x={px - 12} y={0} width={24} height={H} fill="transparent" />
              </g>
            )
          })}
        </svg>

        {activePoint && (
          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[16rem] -translate-x-1/2 rounded-mp-lg border border-mp-border-strong/60 bg-mp-card/95 px-3 py-2 text-left font-body text-[11px] leading-relaxed text-mp-ink-secondary shadow-mp-3 backdrop-blur-md">
            <span className="font-mono font-semibold text-mp-btc-text">
              {formatDualUsd(activePoint.usd, rate).btc}
            </span>
            <span className="ml-1.5 font-mono text-mp-ink-tertiary">
              {formatUsdCompact(activePoint.usd)}
            </span>
            {activePoint.date && <span className="block mt-0.5">as of {activePoint.date}</span>}
            <span className="block mt-0.5 opacity-90">{activePoint.note}</span>
          </div>
        )}
      </div>

      <p className="mt-1 font-body text-[10px] leading-snug text-mp-ink-tertiary">
        {hasTrend
          ? `${points.length} verified threshold changes · BTC shown at live rate`
          : 'No tracked change history yet — single verified point. First pipeline change seeds the trend.'}
      </p>
    </div>
  )
}
