import { motion } from 'motion/react'
import { TrendingDown, Clock, Zap, Shield, Coins } from 'lucide-react'
import type { PitchStats } from '../../lib/pitchStats'
import { formatUsd } from '../../lib/pitchStats'
import { MotionImageBackground } from '../ui/MotionImageBackground'

type Props = { stats: PitchStats; loading?: boolean }

function BarChart({
  title,
  subtitle,
  series,
  max,
  suffix = '',
}: {
  title: string
  subtitle: string
  series: { label: string; value: number; color: string; detail: string }[]
  max: number
  suffix?: string
}) {
  return (
    <div className="card-elevated h-full">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg text-ink">{title}</h3>
          <p className="text-xs text-ink-muted mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-5">
        {series.map((s, i) => (
          <div key={s.label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-ink-secondary">{s.label}</span>
              <span className="font-mono text-ink">
                {suffix === '$' ? formatUsd(s.value) : `${s.value}${suffix}`}
              </span>
            </div>
            <div className="h-10 sm:h-12 rounded-mp-md bg-section overflow-hidden border border-mp">
              <motion.div
                className="h-full rounded-mp-md flex items-center justify-end pr-3"
                style={{ background: s.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min((s.value / max) * 100, 100)}%` }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 1.2, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="text-[10px] font-mono font-medium text-ink-inverse/90 hidden sm:inline">
                  {s.detail}
                </span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SovereigntyPillars({ stats }: { stats: PitchStats }) {
  const pillars = [
    { icon: Zap, label: 'Speed', score: Math.min(100, Math.round(stats.timeSavingsPct * 1.1)), color: '#F7931A' },
    { icon: Coins, label: 'Value', score: Math.min(100, stats.costSavingsPct), color: '#E07B0F' },
    { icon: Shield, label: 'Sovereignty', score: Math.round(stats.avgSovereignty * 10), color: '#16A34A' },
  ]

  return (
    <div className="card-elevated">
      <h3 className="font-display font-semibold text-lg text-ink mb-1">Bitcoin advantage pillars</h3>
      <p className="text-xs text-ink-muted mb-6">Live-derived from {stats.programCount} jurisdiction programs</p>
      <div className="grid sm:grid-cols-3 gap-4">
        {pillars.map(({ icon: Icon, label, score, color }, i) => (
          <div key={label} className="text-center">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 border-2"
              style={{ borderColor: color, background: `${color}18` }}
            >
              <Icon size={22} style={{ color }} />
            </div>
            <div className="font-display text-2xl font-semibold text-ink">{score}</div>
            <div className="text-xs text-ink-muted mb-2">{label}</div>
            <svg viewBox="0 0 100 24" className="w-full h-6" aria-hidden>
              <rect x="0" y="8" width="100" height="8" rx="4" fill="rgb(var(--mp-section-rgb))" />
              <motion.rect
                x="0"
                y="8"
                height="8"
                rx="4"
                fill={color}
                initial={{ width: 0 }}
                whileInView={{ width: score }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.2 }}
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SavingsGraphs({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-5 animate-pulse">
        <div className="card h-72 bg-section" />
        <div className="card h-72 bg-section" />
      </div>
    )
  }

  const costMax = Math.max(stats.traditionalAdvisoryUsd, stats.motopassAdvisoryUsd) * 1.1
  const timeMax = Math.max(stats.avgProcessingMonths, stats.fastTrackMonths) * 1.15

  return (
    <section className="relative overflow-hidden px-4 sm:px-6 py-16 sm:py-20">
      <MotionImageBackground image="/images/funding-flow.jpg" duration={32} />
      <MotionImageBackground image="/images/passport.jpg" duration={38} opacity="0.35" className="mix-blend-multiply dark:mix-blend-soft-light" />
      <div className="absolute inset-0 bg-gradient-hero-fade" />
      <div className="absolute inset-0 bg-canvas/55 dark:bg-canvas/70" />

      <div className="relative max-w-7xl mx-auto">
        <div className="section-label mb-2 flex items-center gap-2">
          <TrendingDown size={12} /> BITCOIN SAVINGS ENGINE
        </div>
        <h2 className="text-2xl sm:text-4xl font-display font-semibold text-ink mb-3 max-w-2xl">
          Heavy proof: cost &amp; time collapse on Bitcoin rails
        </h2>
        <p className="text-sm text-ink-secondary max-w-2xl mb-10 leading-relaxed">
          MotoPass auto-evolves these charts from live program data — traditional advisory stacks vs
          Bitcoin-verified, Lightning-ready pathways. Speed, value, sovereignty — not marketing slides.
        </p>

        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          <BarChart
            title="Advisory & friction cost"
            subtitle={`${stats.costSavingsPct}% lower all-in advisory friction`}
            max={costMax}
            suffix="$"
            series={[
              {
                label: 'Traditional law + consultant stack',
                value: stats.traditionalAdvisoryUsd,
                color: 'linear-gradient(90deg, #A8A29E, #71717A)',
                detail: 'opaque fees',
              },
              {
                label: 'MotoPass + Bitcoin verification',
                value: stats.motopassAdvisoryUsd,
                color: 'linear-gradient(90deg, #F7931A, #E07B0F)',
                detail: 'verified',
              },
            ]}
          />
          <BarChart
            title="Residency timeline"
            subtitle={`${stats.timeSavingsPct}% faster on Bitcoin-native track`}
            max={timeMax}
            suffix=" mo"
            series={[
              {
                label: 'Traditional average pipeline',
                value: stats.avgProcessingMonths,
                color: 'linear-gradient(90deg, #A8A29E, #71717A)',
                detail: 'slow',
              },
              {
                label: 'Lightning-ready fast track',
                value: stats.fastTrackMonths,
                color: 'linear-gradient(90deg, #16A34A, #F7931A)',
                detail: 'BTC speed',
              },
            ]}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-5">
          <motion.div
            className="card-elevated border-l-4 border-l-btc-orange text-center py-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-3xl sm:text-4xl font-display text-gradient-orange">{formatUsd(stats.costSavingsUsd)}</div>
            <div className="text-xs text-ink-muted mt-1 uppercase tracking-wider font-mono">Est. cost savings</div>
          </motion.div>
          <motion.div
            className="card-elevated border-l-4 border-l-status-green text-center py-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-3xl sm:text-4xl font-display text-ink flex items-center justify-center gap-2">
              <Clock size={28} className="text-status-green" />
              {stats.timeSavingsMonths}mo
            </div>
            <div className="text-xs text-ink-muted mt-1 uppercase tracking-wider font-mono">Months reclaimed</div>
          </motion.div>
          <motion.div
            className="card-elevated border-l-4 border-l-nostr-violet text-center py-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-3xl sm:text-4xl font-display text-ink">{stats.lightningCount}</div>
            <div className="text-xs text-ink-muted mt-1 uppercase tracking-wider font-mono">Lightning-ready programs</div>
          </motion.div>
        </div>

        <SovereigntyPillars stats={stats} />
      </div>
    </section>
  )
}