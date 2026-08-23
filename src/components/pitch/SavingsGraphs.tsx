import { useRef, useState } from 'react'
import { Minus, Play, TrendingDown } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import {
  DASHBOARD_METRICS,
  formatMetricValue,
  metricSuffix,
  type DashboardMetric,
} from '../../lib/savingsDashboardMetrics'
import { useI18n } from '../../i18n/I18nContext'
import { SavingsPresentation } from './SavingsPresentation'
import { InfoTip } from '../ui/InfoTip'

interface SavingsGraphsProps {
  title?: string
  loading?: boolean
}

/** Plain-English "what does this figure mean" for each modeled savings metric. */
const METRIC_MEANING: Record<string, string> = {
  legal: 'Modeled total for the same citizenship goals through boutique cross-border counsel — the comparison baseline.',
  time: 'Modeled elapsed months from first engagement to passport in hand for each path.',
  jurisdictions: 'Number of sovereign options each path opens — MotoPass layers multiple programs where traditional counsel typically limits to one.',
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
  meaning,
}: {
  label: string
  value: number
  max: number
  tone: 'traditional' | 'motopass'
  delay: number
  active: boolean
  displayValue: string
  suffix: string
  meaning: string
}) {
  const widthPct = Math.max(6, Math.round((value / max) * 100))

  return (
    <InfoTip
      tip={
        <span>
          <strong className="font-mono font-semibold text-ink">{label}</strong> · {displayValue}
          {suffix ? <span> {suffix}</span> : null}
          <span className="block mt-1 opacity-90">{meaning}</span>
        </span>
      }
      className="w-full"
    >
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
    </InfoTip>
  )
}

function MetricPanel({ metric, index }: { metric: DashboardMetric; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const max = Math.max(metric.traditional, metric.motopass)
  const suffix = metricSuffix(metric.unit)
  const meaning = METRIC_MEANING[metric.id] ?? 'Modeled estimate shown for member evaluation.'

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
          meaning={meaning}
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
          meaning={meaning}
        />
      </div>
    </article>
  )
}

function ModeledSummaryItem({
  value,
  label,
  meaning,
}: {
  value: string
  label: string
  meaning: string
}) {
  return (
    <InfoTip
      tip={
        <span>
          <strong className="font-mono font-semibold text-ink">{label}</strong> · {value}
          <span className="block mt-1 opacity-90">{meaning}</span>
        </span>
      }
      className="savings-v3-summary__item"
    >
      <span className="savings-v3-summary__value">{value}</span>
      <span className="savings-v3-summary__label">{label}</span>
    </InfoTip>
  )
}

export function SavingsGraphs({ title = 'Cost & time, modeled — not promised', loading }: SavingsGraphsProps) {
  const { t } = useI18n()
  const [presentationOpen, setPresentationOpen] = useState(false)

  if (loading) {
    return (
      <section id="pitch-savings" className="savings-dashboard-v3 scroll-mt-header" aria-busy="true">
        <div className="savings-dashboard-v3__ambient" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          {/* Structurally identical skeleton: same containers/grids as the loaded
              section so the swap is layout-stable (mobile CLS stays ~0). */}
          <header className="savings-v3-header">
            <div className="savings-v3-header__brand">
              <span className="skeleton-shimmer h-[52px] w-[52px] rounded-[14px]" />
              <div className="space-y-2">
                <span className="skeleton-shimmer block h-3 w-32" />
                <span className="skeleton-shimmer block h-5 w-56" />
              </div>
            </div>
            <span className="skeleton-shimmer block h-8 w-full max-w-md" />
          </header>
          <div className="savings-v3-summary" aria-hidden>
            {[0, 1, 2].map(i => (
              <div key={i} className="savings-v3-summary__item">
                <span className="skeleton-shimmer block h-7 w-24 mx-auto sm:mx-0" />
                <span className="skeleton-shimmer block h-3 w-32 mx-auto sm:mx-0" />
              </div>
            ))}
          </div>
          <div className="savings-v3-panels" aria-hidden>
            {[0, 1, 2].map(i => (
              <div key={i} className="savings-v3-panel">
                <span className="skeleton-shimmer block h-4 w-1/2" />
                <span className="skeleton-shimmer block h-14 w-full mt-1" />
                <span className="skeleton-shimmer block h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
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
            <InfoTip
              tip="Modeled for member evaluation only — illustrative sovereign-stacking economics, not a guarantee. Figures shown as exact USD and day counts for clarity."
              className="savings-v3-header__copy"
            >
              <p className="savings-v3-header__copy">
                Illustrative sovereign stacking comparison — elite advisory modeling, not a guarantee. Figures
                shown as exact USD and day counts for clarity.
              </p>
            </InfoTip>
            <button
              type="button"
              onClick={() => setPresentationOpen(true)}
              className="savings-v3-export"
              aria-label={t('pitch.savings.presentation')}
            >
              <Play size={14} aria-hidden />
              {t('pitch.savings.presentation')}
            </button>
          </header>

          <div className="savings-v3-summary" aria-label="Modeled savings summary">
            <ModeledSummaryItem
              value="$77,100"
              label="Legal delta"
              meaning="Modeled savings vs the traditional-counsel baseline — illustrative, not a guarantee."
            />
            <div className="savings-v3-summary__divider" aria-hidden />
            <ModeledSummaryItem
              value="42"
              label="Days faster"
              meaning="Modeled elapsed-time advantage of the platform path over boutique counsel."
            />
            <div className="savings-v3-summary__divider" aria-hidden />
            <ModeledSummaryItem
              value="47"
              label="More jurisdictions"
              meaning="Additional sovereign options surfaced by stacking programs, versus a single traditional engagement."
            />
          </div>

          <div className="savings-v3-panels">
            {DASHBOARD_METRICS.map((metric, i) => (
              <MetricPanel key={metric.id} metric={metric} index={i} />
            ))}
          </div>

          <InfoTip
            tip="Modeled for member evaluation only. Traditional advisory assumes boutique counsel across three jurisdictions; MotoPass reflects platform-modeled stack economics at current program depth."
          >
            <p className="savings-v3-footnote">
              Modeled for member evaluation only. Traditional advisory assumes boutique counsel across three
              jurisdictions; MotoPass reflects platform-modeled stack economics at current program depth.
            </p>
          </InfoTip>
        </div>
      </section>

      <SavingsPresentation
        open={presentationOpen}
        onClose={() => setPresentationOpen(false)}
        title={title}
      />
    </>
  )
}