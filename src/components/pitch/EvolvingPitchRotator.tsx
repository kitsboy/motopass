import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { PitchStats } from '../../lib/pitchStats'
import { formatUsd } from '../../lib/pitchStats'

const ROTATING_LINES = [
  'Bitcoin is the speed.',
  'Bitcoin is the value.',
  'Bitcoin is the sovereignty.',
  'Verify every claim on-chain.',
  'Stack jurisdictions with proof.',
]

type Props = { stats: PitchStats | null; loading: boolean }

export function EvolvingPitchRotator({ stats, loading }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % ROTATING_LINES.length), 4200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-6">
      <div className="h-8 sm:h-9 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            className="font-display text-lg sm:text-xl text-btc-orange-deep tracking-tight"
          >
            {ROTATING_LINES[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Jurisdictions',
            value: loading ? '…' : String(stats?.programCount ?? 50),
            sub: 'live tracker',
          },
          {
            label: 'Cost saved',
            value: loading ? '…' : stats ? formatUsd(stats.costSavingsUsd) : '—',
            sub: 'vs traditional advisory',
          },
          {
            label: 'Time saved',
            value: loading ? '…' : stats ? `${stats.timeSavingsMonths}mo` : '—',
            sub: 'Bitcoin-fast track',
          },
          {
            label: 'Sovereignty',
            value: loading ? '…' : stats ? `${stats.avgSovereignty}/10` : '—',
            sub: 'avg score',
          },
        ].map(({ label, value, sub }) => (
          <motion.div
            key={label}
            className="card-muted py-3 px-3 sm:px-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">{label}</div>
            <div className="stat-value text-xl sm:text-2xl mt-0.5">{value}</div>
            <div className="text-[10px] text-ink-muted mt-0.5">{sub}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}