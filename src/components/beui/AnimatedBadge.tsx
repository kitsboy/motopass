import { AlertTriangle, Check, Circle, Info, LoaderCircle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type Status = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'

const STATUS_CLASS: Record<Status, string> = {
  neutral: 'border-white/15 bg-sovereign-void text-sovereign-silver',
  info: 'border-btc-orange/30 bg-btc-orange/10 text-btc-orange',
  success: 'border-status-green/30 bg-status-green/10 text-status-green',
  warning: 'border-status-amber/30 bg-status-amber/10 text-status-amber',
  danger: 'border-status-red/30 bg-status-red/10 text-status-red',
  loading: 'border-btc-orange/30 bg-btc-orange/10 text-btc-orange',
}

const ICONS = { neutral: Circle, info: Info, success: Check, warning: AlertTriangle, danger: X, loading: LoaderCircle }

export function AnimatedBadge({
  status = 'neutral',
  children,
  className,
}: {
  status?: Status
  children: React.ReactNode
  className?: string
}) {
  const Icon = ICONS[status]
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
      STATUS_CLASS[status],
      className,
    )}>
      <Icon size={12} className={status === 'loading' ? 'animate-spin' : ''} />
      {children}
    </span>
  )
}