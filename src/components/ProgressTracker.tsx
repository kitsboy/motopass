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
                'w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0',
                done ? 'border-status-green bg-status-green/20 text-status-green' :
                active ? 'border-btc-orange bg-btc-orange/20 text-btc-orange' :
                'border-white/15 text-sovereign-silver',
              )}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={cn('w-px flex-1 min-h-[20px]', done ? 'bg-status-green/40' : 'bg-white/10')} />
              )}
            </div>
            <div className={cn('pb-4 pt-1', active && 'text-btc-orange')}>
              <div className="text-sm font-medium">{step.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}