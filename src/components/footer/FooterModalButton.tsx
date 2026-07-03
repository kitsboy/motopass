import type { ReactNode } from 'react'

type Props = {
  onClick: () => void
  icon: ReactNode
  label: string
  sub?: string
}

export function FooterModalButton({ onClick, icon, label, sub }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-mp-xl border border-mp bg-card hover:border-btc-orange/35 hover:bg-btc-orange-soft/30 hover:shadow-card transition-all duration-200 min-h-[88px] w-full"
    >
      <span className="w-9 h-9 rounded-full bg-section border border-mp flex items-center justify-center text-btc-orange group-hover:scale-105 group-hover:border-btc-orange/30 transition-transform">
        {icon}
      </span>
      <span className="text-xs font-semibold text-ink tracking-tight">{label}</span>
      {sub && <span className="text-[10px] text-ink-muted font-mono -mt-1">{sub}</span>}
    </button>
  )
}