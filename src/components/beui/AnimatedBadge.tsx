import { AlertTriangle, Check, Circle, Info, LoaderCircle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type Status = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'

const STATUS_CLASS: Record<Status, string> = {
  neutral: 'border-mp bg-card-muted text-ink-muted',
  info: 'border-btc-orange/30 bg-btc-orange-soft text-btc-orange-deep',
  success: 'border-emerald-200 bg-emerald-50 text-status-green',
  warning: 'border-amber-200 bg-amber-50 text-status-amber',
  danger: 'border-red-200 bg-red-50 text-status-red',
  loading: 'border-btc-orange/30 bg-btc-orange-soft text-btc-orange-deep',
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