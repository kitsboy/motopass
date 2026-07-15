import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import type { SavingsRow } from '../../lib/pitchStats'
import { BtcDualPrice } from '../BtcDualPrice'
import { Card } from '../ui/Card'

interface SavingsGraphsProps {
  title?: string
  rows: SavingsRow[]
  loading?: boolean
}

function ValueDisplay({ value, unit }: { value: number; unit: string }) {
  if (unit === '$') {
    return <BtcDualPrice usd={value} size="sm" layout="stack" />
  }
  return (
    <span className="font-mono text-sm tabular-nums text-ink">
      {value.toLocaleString()}
      <span className="text-ink-muted text-xs ml-0.5">{unit === 'days' ? 'days' : unit}</span>
    </span>
  )
}

function MetricColumn({
  label,
  tone,
  value,
  max,
  delay,
  unit,
}: {
  label: string
  tone: 'muted' | 'btc'
  value: number
  max: number
  delay: number
  unit: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8% 0px' })
  const reduceMotion = useReducedMotion()
  const heightPct = Math.max(10, Math.round((value / max) * 100))

  return (
    <div ref={ref} className="flex flex-col items-center flex-1 min-w-0 gap-3">
      <div className="relative flex h-36 sm:h-40 w-full items-end justify-center px-2">
        <motion.div
          className={`w-full max-w-[3.5rem] rounded-t-xl origin-bottom ${
            tone === 'btc'
              ? 'bg-gradient-to-t from-btc-orange to-btc-orange/75 shadow-[0_0_20px_rgba(255,149,0,0.2)]'
              : 'bg-ink-muted/35'
          }`}
          style={{ height: `${heightPct}%` }}
          initial={{ scaleY: reduceMotion ? 1 : 0 }}
          animate={inView ? { scaleY: 1 } : {}}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
      <div className="text-center w-full">
        <span
          className={`block font-chrome text-[10px] uppercase tracking-wider mb-1.5 ${
            tone === 'btc' ? 'text-mp-btc-text' : 'text-ink-muted'
          }`}
        >
          {label}
        </span>
        <ValueDisplay value={value} unit={unit} />
      </div>
    </div>
  )
}

function MetricCard({
  row,
  max,
  index,
}: {
  row: SavingsRow
  max: number
  index: number
}) {
  return (
    <Card variant="elevated" animate delay={0.05 + index * 0.06} className="!p-5 sm:!p-6 flex flex-col h-full">
      <h3 className="font-display font-semibold text-sm text-ink mb-5 text-center sm:text-left tracking-tight">
        {row.label}
      </h3>
      <div className="flex items-end gap-3 sm:gap-4 flex-1 mt-auto">
        <MetricColumn
          label="Traditional"
          tone="muted"
          value={row.traditional}
          max={max}
          delay={index * 0.1}
          unit={row.unit}
        />
        <div className="w-px self-stretch bg-mp/50 shrink-0" aria-hidden />
        <MetricColumn
          label="MotoPass"
          tone="btc"
          value={row.motopass}
          max={max}
          delay={index * 0.1 + 0.12}
          unit={row.unit}
        />
      </div>
    </Card>
  )
}

export function SavingsGraphs({ title = 'Cost & time, modeled — not promised', rows, loading }: SavingsGraphsProps) {
  if (loading) {
    return (
      <section id="pitch-savings" className="relative overflow-hidden surface-band py-14 sm:py-20 scroll-mt-header">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-8 w-48 rounded-lg bg-card-muted/60 animate-pulse mb-4" />
          <div className="h-12 w-96 max-w-full rounded-lg bg-card-muted/60 animate-pulse mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-card bg-card-muted/50 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  const maxByRow = rows.map(r => Math.max(r.traditional, r.motopass))

  return (
    <section
      id="pitch-savings"
      className="relative overflow-hidden surface-band py-14 sm:py-20 scroll-mt-header"
      style={{ clipPath: 'polygon(0 3vw, 100% 0, 100% 100%, 0 100%)' }}
      aria-labelledby="savings-graphs-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <span className="club-eyebrow block">Cost &amp; Time, Modeled</span>
          <h2 id="savings-graphs-heading" className="mt-3 font-display text-h2 text-ink tracking-tight">
            {title}
          </h2>
          <p className="mt-4 font-body text-body text-ink-secondary leading-relaxed">
            Figures pulled live from <code className="font-mono text-sm text-mp-btc-text">countries.json</code> — shown Bitcoin-first at spot. Every bar updates when program terms or BTC price moves.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {rows.map((row, i) => (
            <MetricCard key={row.label} row={row} max={maxByRow[i]} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}