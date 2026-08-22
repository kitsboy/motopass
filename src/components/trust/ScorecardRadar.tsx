import { useId, useState } from 'react'
import type { CountryTrustEnvelope } from '../../types/countryTrust'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

const AXIS_ORDER = ['crypto_friendly', 'freedom', 'stability', 'tax', 'cost', 'mobility', 'banking'] as const

const AXIS_KEY: Record<(typeof AXIS_ORDER)[number], string> = {
  crypto_friendly: 'trust.axis.cryptoFriendly',
  freedom: 'trust.axis.freedom',
  stability: 'trust.axis.stability',
  tax: 'trust.axis.tax',
  cost: 'trust.axis.cost',
  mobility: 'trust.axis.mobility',
  banking: 'trust.axis.banking',
}

/**
 * ScorecardRadar — 7-axis radar chart.
 * Interactive: hover an axis to see its label + value in the centre readout.
 * Axes with no verified value render as "pending" (dashed ring), never a
 * fabricated number — the honesty rule from the envelope.
 */
export function ScorecardRadar({ scorecard }: { scorecard: CountryTrustEnvelope['scorecard'] }) {
  const { t } = useI18n()
  const [active, setActive] = useState<string | null>(null)
  const id = useId()

  const axes = AXIS_ORDER.map((k, i) => ({
    key: k,
    ...(scorecard.axes[k] ?? { value: null, present: false }),
    index: i,
    label: t(AXIS_KEY[k] as never),
  }))

  const cx = 100
  const cy = 100
  const R = 74
  const n = axes.length

  const point = (i: number, r: number): [number, number] => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }

  const poly = (r: number) => axes.map((a) => point(a.index, r).join(',')).join(' ')
  const valuePoly = axes
    .map((a) =>
      a.present && a.value != null ? point(a.index, (a.value / 10) * R).join(',') : null,
    )
    .filter(Boolean)
    .join(' ')

  const activeAxis = active ? axes.find((a) => a.key === active) : null

  return (
    <div className="flex w-full flex-col gap-2">
      <svg
        viewBox="0 0 200 200"
        className="mx-auto w-full max-w-[220px]"
        role="img"
        aria-label={t('trust.radarAria')}
      >
        <defs>
          <radialGradient id={`${id}-fill`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,149,0,0.28)" />
            <stop offset="100%" stopColor="rgba(255,149,0,0.04)" />
          </radialGradient>
        </defs>

        {/* grid rings */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={poly(R * f)}
            fill="none"
            stroke="var(--mp-border-rgb)"
            strokeOpacity={0.45}
            strokeWidth="1"
          />
        ))}

        {/* spokes */}
        {axes.map((a) => {
          const [x, y] = point(a.index, R)
          return (
            <line
              key={a.key}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--mp-border-rgb)"
              strokeOpacity={0.35}
              strokeWidth="1"
            />
          )
        })}

        {/* value polygon (real values only) */}
        {valuePoly && (
          <polygon
            points={valuePoly}
            fill={`url(#${id}-fill)`}
            stroke="#f97316"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {/* vertex dots + hover targets */}
        {axes.map((a) => {
          const [x, y] = point(a.index, a.present && a.value != null ? (a.value / 10) * R : 0)
          const [tx, ty] = point(a.index, R + 15)
          return (
            <g
              key={a.key}
              onMouseEnter={() => setActive(a.key)}
              onMouseLeave={() => setActive(null)}
              className="cursor-help"
            >
              {a.present && a.value != null ? (
                <circle cx={x} cy={y} r={3.5} fill="#f97316" stroke="#fff" strokeWidth="1.2" />
              ) : (
                <circle cx={tx} cy={ty} r={2.5} fill="var(--mp-ink-muted-rgb)" opacity={0.6} />
              )}
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                fontSize="8"
                fill="var(--mp-ink-secondary-rgb)"
                className="select-none"
              >
                {a.label.length > 9 ? `${a.label.slice(0, 8)}…` : a.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="min-h-[2.5rem] rounded-mp-lg border border-mp-border-subtle bg-mp-section/60 px-3 py-2 text-center font-body text-[11px] leading-relaxed text-mp-ink-secondary">
        {activeAxis ? (
          activeAxis.present && activeAxis.value != null ? (
            <span>
              <strong className="font-mono text-mp-ink">{activeAxis.label}</strong> ·{' '}
              {activeAxis.value}/10
            </span>
          ) : (
            <span>
              <strong className="text-mp-ink-tertiary">{activeAxis.label}</strong> ·{' '}
              {t('trust.pendingVerify')}
            </span>
          )
        ) : (
          <span className="text-mp-ink-tertiary">
            {formatT(t, 'trust.hoverHint', {
              verified: axes.filter((a) => a.present).length,
              total: n,
            })}
          </span>
        )}
      </div>
    </div>
  )
}
