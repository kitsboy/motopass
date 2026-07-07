import { Check } from 'lucide-react'
import { STATUS_STEPS, type ApplicationStatus } from '../types/user'
import { cn } from '../lib/utils'

export function ProgressTracker({ status }: { status: ApplicationStatus }) {
  const idx = STATUS_STEPS.findIndex(s => s.key === status)

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= idx
        const active = i === idx
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors',
                done ? 'border-mp-proof/50 bg-mp-proof-soft text-mp-proof' :
                active ? 'border-btc-orange bg-btc-orange-soft text-btc-orange-deep' :
                'border-mp bg-card-muted text-ink-muted',
              )}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={cn('w-0.5 flex-1 min-h-[24px]', done ? 'bg-mp-proof/40' : 'bg-mp')} />
              )}
            </div>
            <div className={cn('pb-5 pt-1.5', active && 'text-btc-orange-deep')}>
              <div className={cn('text-sm font-medium', done || active ? 'text-ink' : 'text-ink-muted')}>{step.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}