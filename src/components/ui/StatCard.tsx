import type { ReactNode } from 'react'
import { motion } from 'motion/react'

type LegacyProps = {
  value: ReactNode
  label: string
  accent?: boolean
  icon?: ReactNode
  delta?: never
  index?: never
}

type CinematicProps = {
  label: string
  value: string
  delta?: { value: string; direction: 'up' | 'down' }
  index?: number
  accent?: never
  icon?: never
}

export function StatCard(props: LegacyProps | CinematicProps) {
  if ('icon' in props && props.icon !== undefined) {
    const { value, label, accent, icon } = props
    return (
      <div className="card text-center py-5 px-4">
        {icon && <div className="flex justify-center mb-2 text-btc-orange">{icon}</div>}
        <div className={`stat-value ${accent ? 'text-gradient-orange' : ''}`}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    )
  }

  if (typeof props.value !== 'string') {
    const { value, label, accent } = props as LegacyProps
    return (
      <div className="card text-center py-5 px-4">
        <div className={`stat-value ${accent ? 'text-gradient-orange' : ''}`}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    )
  }

  const { label, value, delta, index = 0 } = props as CinematicProps
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="group flex items-center justify-between gap-4 rounded-card border border-mp-border bg-mp-card p-4 shadow-mp-1 transition-[box-shadow,border-color] duration-base ease-spring-gentle hover:border-mp-btc/30 hover:shadow-mp-2 sm:block sm:p-5"
    >
      <span className="block font-chrome text-[11px] uppercase tracking-[0.14em] text-mp-ink-tertiary">
        {label}
      </span>
      <div className="mt-0 flex items-baseline gap-2 sm:mt-2">
        <span className="font-mono text-h3 tabular-nums text-mp-ink">{value}</span>
        {delta && (
          <span
            className={`font-mono text-xs ${delta.direction === 'up' ? 'text-mp-proof' : 'text-mp-wax'}`}
          >
            {delta.direction === 'up' ? '▲' : '▼'} {delta.value}
          </span>
        )}
      </div>
    </motion.div>
  )
}