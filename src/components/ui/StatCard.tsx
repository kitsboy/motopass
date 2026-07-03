import type { ReactNode } from 'react'

export function StatCard({
  value,
  label,
  accent,
  icon,
}: {
  value: ReactNode
  label: string
  accent?: boolean
  icon?: ReactNode
}) {
  return (
    <div className="card text-center py-5 px-4">
      {icon && <div className="flex justify-center mb-2 text-btc-orange">{icon}</div>}
      <div className={`stat-value ${accent ? 'text-gradient-orange' : ''}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}