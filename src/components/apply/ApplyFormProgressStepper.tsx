import { Check } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { applyFormCompletion } from '../../lib/applyDraftStorage'
import { cn } from '../../lib/utils'

const STEPS = [
  { key: 'name', labelKey: 'apply.stepName' as const, required: true },
  { key: 'program', labelKey: 'apply.stepProgram' as const, required: true },
  { key: 'notes', labelKey: 'apply.stepNotes' as const, required: false },
  { key: 'submit', labelKey: 'apply.stepSubmit' as const, required: true },
] as const

export function ApplyFormProgressStepper({
  name,
  program,
  notes,
  hasNostr,
}: {
  name: string
  program: string
  notes: string
  hasNostr: boolean
}) {
  const { t } = useI18n()
  const pct = applyFormCompletion({ name, program, notes, hasNostr })

  const stepDone = (key: (typeof STEPS)[number]['key']) => {
    if (key === 'name') return !!name.trim()
    if (key === 'program') return !!program.trim()
    if (key === 'notes') return !!notes.trim()
    return !!name.trim() && !!program.trim()
  }

  const activeIdx = STEPS.findIndex(s => !stepDone(s.key))
  const currentIdx = activeIdx === -1 ? STEPS.length - 1 : activeIdx

  return (
    <div className="rounded-mp-md border border-mp/60 bg-card-muted/40 p-4 space-y-3" aria-label={t('apply.progressLabel')}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-chrome text-xs font-semibold text-ink">{t('apply.progressTitle')}</span>
        <span className="font-mono text-[10px] text-mp-btc-text uppercase tracking-wider">
          {formatT(t, 'apply.progressPct', { pct })}
        </span>
      </div>

      <div
        className="h-1.5 rounded-full bg-mp/50 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={formatT(t, 'apply.progressPct', { pct })}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-btc-orange/80 to-mp-proof/80 transition-all duration-fast"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STEPS.map((step, i) => {
          const done = stepDone(step.key)
          const active = i === currentIdx
          return (
            <li
              key={step.key}
              className={cn(
                'flex items-center gap-1.5 rounded-chip border px-2 py-1.5 text-[10px] font-chrome transition-colors',
                done
                  ? 'border-mp-proof/35 bg-mp-proof/10 text-mp-proof'
                  : active
                    ? 'border-btc-orange/35 bg-btc-orange-soft/50 text-mp-btc-text'
                    : 'border-mp/60 text-ink-muted',
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold',
                  done
                    ? 'border-mp-proof/50 bg-mp-proof-soft text-mp-proof'
                    : active
                      ? 'border-btc-orange bg-btc-orange-soft text-btc-orange-deep'
                      : 'border-mp bg-card-muted',
                )}
                aria-hidden
              >
                {done ? <Check size={10} /> : i + 1}
              </span>
              <span className="truncate">{t(step.labelKey)}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}