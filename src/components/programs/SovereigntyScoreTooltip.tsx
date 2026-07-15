import { useId, useState } from 'react'
import { Info } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import { getSovereigntyBreakdown } from '../../lib/sovereigntyBreakdown'
import type { Program } from './types'

interface SovereigntyScoreTooltipProps {
  program: Program
  score: number
  isFlagship: boolean
}

export function SovereigntyScoreTooltip({ program, score, isFlagship }: SovereigntyScoreTooltipProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const breakdown = getSovereigntyBreakdown(program)

  if (!isFlagship) {
    return <span className="font-mono text-sm text-mp-ink">{score}</span>
  }

  const formatValue = (key: string, value: string) => {
    if (key === 'lightning') {
      return value === 'ready' ? t('modal.yes') : t('modal.no')
    }
    return value
  }

  return (
    <span className="relative inline-flex items-center gap-1">
      <span className={`font-mono text-sm ${isFlagship ? 'text-mp-btc-text' : 'text-mp-ink'}`}>{score}</span>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-mp-btc-text hover:bg-mp-btc-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mp-btc"
        aria-label={t('programs.scoreBreakdown')}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <Info size={12} aria-hidden="true" />
      </button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-mp-md border border-mp-border bg-mp-card p-2.5 text-left shadow-mp-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
            {t('programs.scoreBreakdown')}
          </span>
          <dl className="mt-1.5 space-y-1">
            {breakdown.map((item) => (
              <div key={item.key} className="flex justify-between gap-2 text-[10px]">
                <dt className="text-mp-ink-muted">{t(item.labelKey as 'programs.scoreBase')}</dt>
                <dd className="font-mono text-mp-ink">{formatValue(item.key, item.value)}</dd>
              </div>
            ))}
          </dl>
        </span>
      )}
    </span>
  )
}