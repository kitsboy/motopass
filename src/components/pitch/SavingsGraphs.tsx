import { useRef, useState } from 'react'
import { Download, Minus, TrendingDown } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import type { SavingsRow } from '../../lib/pitchStats'
import { useI18n } from '../../i18n/I18nContext'
import { downloadSavingsGraph } from '../../lib/savingsGraphExport'

interface SavingsGraphsProps {
  title?: string
  loading?: boolean
}

type MetricUnit = 'usd' | 'days' | 'count'

interface DashboardMetric {
  id: string
  label: string
  traditional: number
  motopass: number
  unit: MetricUnit
  deltaLabel: string
}

const DASHBOARD_METRICS: DashboardMetric[] = [
  {
    id: 'legal',
    label: 'Legal & advisory',
    traditional: 81_000,
    motopass: 3_900,
    unit: 'usd',
    deltaLabel: '−$77,100 modeled',
  },
  {
    id: 'time',
    label: 'Time to approval',
    traditional: 177,
    motopass: 135,
    unit: 'days',
    deltaLabel: '−42 days modeled',
  },
  {
    id: 'jurisdictions',
    label: 'Jurisdictions',
    traditional: 3,
    motopass: 50,
    unit: 'count',
    deltaLabel: '+47 jurisdictions modeled',
  },
]

const EXPORT_ROWS: SavingsRow[] = DASHBOARD_METRICS.map(m => ({
  label: m.label,
  traditional: m.traditional,
  motopass: m.motopass,
  unit: m.unit === 'usd' ? '$' : m.unit === 'days' ? 'days' : 'programs',
}))

function formatMetricValue(value: number, unit: MetricUnit): string {
  if (unit === 'usd') return `$${value.toLocaleString()}`
  if (unit === 'days') return `${value.toLocaleString()}`
  return value.toLocaleString()
}

function metricSuffix(unit: MetricUnit): string {
  if (unit === 'days') return 'days'
  if (unit === 'count') return ''
  return ''
}

function ComparisonBar({
  label,
  value,
  max,
  tone,
  delay,
  active,
  displayValue,
  suffix,
}: {
  label: string
  value: number
  max: number
  tone: 'traditional' | 'motopass'
  delay: number
  active: boolean
  displayValue: string
  suffix: string
}) {
  const widthPct = Math.max(6, Math.round((value / max) * 100))

  return (
    <div className="savings-v3-bar-group">
      <div className="savings-v3-bar-head">
        <span className={`savings-v3-bar-label savings-v3-bar-label--${tone}`}>{label}</span>
        <span className={`savings-v3-bar-value savings-v3-bar-value--${tone}`}>
          {displayValue}
          {suffix ? <span className="savings-v3-bar-suffix">{suffix}</span> : null}
        </span>
      </div>
      <div className="savings-v3-bar-track" aria-hidden>
        <motion.div
          className={`savings-v3-bar-fill savings-v3-bar-fill--${tone}${tone === 'motopass' ? ' savings-v3-bar-fill--shimmer' : ''}`}
          style={{ width: `${widthPct}%` }}
          initial={{ scaleX: 0 }}
          animate={active ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
    </div>
  )
}

function MetricPanel({ metric, index }: { metric: DashboardMetric; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const max = Math.max(metric.traditional, metric.motopass)
  const suffix = metricSuffix(metric.unit)

  return (
    <article
      ref={ref}
      className="savings-v3-panel"
      aria-labelledby={`savings-metric-${metric.id}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="savings-v3-panel__head">
        <h3 id={`savings-metric-${metric.id}`} className="savings-v3-panel__title">
          {metric.label}
        </h3>
        <span className="savings-v3-panel__delta">
          <TrendingDown size={12} aria-hidden />
          {metric.deltaLabel}
        </span>
      </div>

      <div className="savings-v3-panel__numbers">
        <div className="savings-v3-stat savings-v3-stat--traditional">
          <span className="savings-v3-stat__eyebrow">Traditional</span>
          <span className="savings-v3-stat__value">
            {formatMetricValue(metric.traditional, metric.unit)}
            {suffix ? <span className="savings-v3-stat__unit">{suffix}</span> : null}
          </span>
        </div>
        <div className="savings-v3-stat-divider" aria-hidden>
          <Minus size={14} />
        </div>
        <div className="savings-v3-stat savings-v3-stat--motopass">
          <span className="savings-v3-stat__eyebrow">MotoPass</span>
          <span className="savings-v3-stat__value">
            {formatMetricValue(metric.motopass, metric.unit)}
            {suffix ? <span className="savings-v3-stat__unit">{suffix}</span> : null}
          </span>
        </div>
      </div>

      <div className="savings-v3-panel__chart">
        <ComparisonBar
          label="Traditional"
          value={metric.traditional}
          max={max}
          tone="traditional"
          delay={index * 0.08}
          active={inView}
          displayValue={formatMetricValue(metric.traditional, metric.unit)}
          suffix={suffix}
        />
        <ComparisonBar
          label="MotoPass"
          value={metric.motopass}
          max={max}
          tone="motopass"
          delay={index * 0.08 + 0.14}
          active={inView}
          displayValue={formatMetricValue(metric.motopass, metric.unit)}
          suffix={suffix}
        />
      </div>
    </article>
  )
}

export function SavingsGraphs({ title = 'Cost & time, modeled — not promised', loading }: SavingsGraphsProps) {
  const { t } = useI18n()
  const [exporting, setExporting] = useState(false)

  const handleExportPng = async () => {
    if (exporting) return
    setExporting(true)
    try {
      await downloadSavingsGraph(EXPORT_ROWS, title)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <section id="pitch-savings" className="savings-dashboard-v3 scroll-mt-header" aria-busy="true">
        <div className="savings-dashboard-v3__ambient" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="h-10 w-56 rounded-xl bg-white/5 animate-pulse mb-6" />
          <div className="h-14 w-full max-w-xl rounded-xl bg-white/5 animate-pulse mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 rounded-[20px] bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="pitch-savings"
      className="savings-dashboard-v3 scroll-mt-header"
      aria-labelledby="savings-graphs-heading"
    >
      <div className="savings-dashboard-v3__ambient" aria-hidden />
      <div className="savings-dashboard-v3__grid" aria-hidden />

      <div className="relative z-[1] mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
        <header className="savings-v3-header">
          <div className="savings-v3-header__brand">
            <img
              src="/images/motopass-logo.png"
              alt="MotoPass"
              className="savings-v3-header__logo"
              width={52}
              height={52}
              loading="lazy"
              decoding="async"
            />
            <div>
              <span className="savings-v3-header__eyebrow">Members · Modeled economics</span>
              <h2 id="savings-graphs-heading" className="savings-v3-header__title">
                {title}
              </h2>
            </div>
          </div>
          <p className="savings-v3-header__copy">
            Illustrative sovereign stacking comparison — elite advisory modeling, not a guarantee. Figures
            shown as exact USD and day counts for clarity.
          </p>
          <button
            type="button"
            onClick={() => void handleExportPng()}
            disabled={exporting}
            className="savings-v3-export"
            aria-label={t('pitch.savings.exportPng')}
          >
            <Download size={14} aria-hidden />
            {exporting ? t('pitch.savings.exporting') : t('pitch.savings.exportPng')}
          </button>
        </header>

        <div className="savings-v3-summary" aria-label="Modeled savings summary">
          <div className="savings-v3-summary__item">
            <span className="savings-v3-summary__value">$77,100</span>
            <span className="savings-v3-summary__label">Legal delta</span>
          </div>
          <div className="savings-v3-summary__divider" aria-hidden />
          <div className="savings-v3-summary__item">
            <span className="savings-v3-summary__value">42</span>
            <span className="savings-v3-summary__label">Days faster</span>
          </div>
          <div className="savings-v3-summary__divider" aria-hidden />
          <div className="savings-v3-summary__item">
            <span className="savings-v3-summary__value">47</span>
            <span className="savings-v3-summary__label">More jurisdictions</span>
          </div>
        </div>

        <div className="savings-v3-panels">
          {DASHBOARD_METRICS.map((metric, i) => (
            <MetricPanel key={metric.id} metric={metric} index={i} />
          ))}
        </div>

        <p className="savings-v3-footnote">
          Modeled for member evaluation only. Traditional advisory assumes boutique counsel across three
          jurisdictions; MotoPass reflects platform-modeled stack economics at current program depth.
        </p>
      </div>
    </section>
  )
}