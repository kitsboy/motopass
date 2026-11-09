import { useState } from 'react'
import { Check, Clock, Bell } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

/**
 * ProgramsOnboarding — a one-time, dismissible strip that explains the three
 * unique MotoPass affordances (proof anchors, freshness badges, watch bell).
 * Shown on first visit to /programs only; the dismissal persists.
 */

const ONBOARDING_KEY = 'motopass-onboarding-v1'

export function ProgramsOnboarding() {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === 'seen'
    } catch {
      return true
    }
  })

  if (dismissed) return null

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'seen')
    } catch {
      /* storage unavailable — session-only dismissal */
    }
    setDismissed(true)
  }

  const items = [
    { icon: Check, key: 'programs.ob.proof' },
    { icon: Clock, key: 'programs.ob.fresh' },
    { icon: Bell, key: 'programs.ob.watch' },
  ] as const

  return (
    <div
      className="mb-5 rounded-mp-lg border border-btc-orange/20 bg-gradient-to-r from-btc-orange-soft/30 via-card/70 to-card/50 backdrop-blur-md px-4 py-3"
      role="note"
      aria-label={t('programs.ob.title')}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
        <span className="font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-btc-orange">
          {t('programs.ob.title')}
        </span>
        {items.map(({ icon: Icon, key }) => (
          <span key={key} className="flex min-w-0 items-start gap-1.5 text-xs text-ink-secondary sm:items-center">
            <Icon size={13} className="mt-0.5 shrink-0 text-mp-btc-text sm:mt-0" aria-hidden />
            <span>{t(key)}</span>
          </span>
        ))}
        <button
          type="button"
          onClick={dismiss}
          className="self-start shrink-0 rounded-chip border border-mp/60 px-2.5 py-0.5 font-chrome text-[10px] text-ink-muted transition-colors hover:border-btc-orange/30 hover:text-ink sm:ml-auto"
        >
          {t('programs.ob.dismiss')}
        </button>
      </div>
    </div>
  )
}
