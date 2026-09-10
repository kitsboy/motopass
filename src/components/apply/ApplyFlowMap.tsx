import { useMemo } from 'react'
import { Check, FileText, Link2, Zap } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

/**
 * ApplyFlowMap — a horizontal step-map of the application journey, rendered
 * above the launch-gates scorecard. Gives applicants the whole path at a
 * glance (connect → details → submit+anchor → fee) with live completion
 * states, so the long page reads as a guided flow instead of a wall of cards.
 */

export type ApplyFlowStep = {
  id: 'connect' | 'details' | 'submit' | 'fee'
  done: boolean
  active: boolean
}

const STEPS: { id: ApplyFlowStep['id']; labelKey: string; icon: typeof Check }[] = [
  { id: 'connect', labelKey: 'apply.flow.connect', icon: Link2 },
  { id: 'details', labelKey: 'apply.flow.details', icon: FileText },
  { id: 'submit', labelKey: 'apply.flow.submit', icon: Check },
  { id: 'fee', labelKey: 'apply.flow.fee', icon: Zap },
]

export function ApplyFlowMap({ steps }: { steps: ApplyFlowStep[] }) {
  const { t } = useI18n()

  const byId = useMemo(() => new Map(steps.map(s => [s.id, s])), [steps])

  return (
    <nav
      aria-label={t('apply.flow.aria')}
      className="mb-6 rounded-mp-lg border border-mp/60 bg-card/60 backdrop-blur-md px-4 py-3"
    >
      <ol className="flex items-stretch gap-1 overflow-x-auto sm:gap-2">
        {STEPS.map((step, i) => {
          const state = byId.get(step.id) ?? { done: false, active: false }
          const Icon = step.icon
          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5"
              aria-current={state.active ? 'step' : undefined}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-base ${
                    state.done
                      ? 'border-mp-proof/50 bg-mp-proof/15 text-mp-proof'
                      : state.active
                        ? 'border-btc-orange/55 bg-btc-orange-soft/60 text-btc-orange shadow-[0_0_12px_rgba(255,149,0,0.18)]'
                        : 'border-mp-border bg-mp-section text-mp-ink-tertiary'
                  }`}
                >
                  {state.done ? <Check size={13} strokeWidth={2.5} /> : <Icon size={13} />}
                </span>
                <span
                  className={`hidden truncate font-chrome text-[10px] font-medium uppercase tracking-wider min-[420px]:inline sm:text-[11px] ${
                    state.done ? 'text-mp-proof' : state.active ? 'text-ink' : 'text-mp-ink-tertiary'
                  }`}
                >
                  {t(step.labelKey as Parameters<typeof t>[0])}
                </span>
                {/* Mobile: show step number instead of label */}
                <span
                  className={`font-mono text-[9px] min-[420px]:hidden ${state.active ? 'text-ink' : 'text-mp-ink-tertiary'}`}
                  aria-hidden
                >
                  {i + 1}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`h-px w-4 shrink-0 sm:w-6 ${
                    state.done ? 'bg-mp-proof/50' : 'bg-mp-border'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
