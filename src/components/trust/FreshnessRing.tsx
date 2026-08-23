import { useId, useState, type ReactNode } from 'react'
import type { FreshnessStatus } from '../../types/countryTrust'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

/**
 * FreshnessRing — the hero honesty visual.
 * Green (FRESH ≤30d) / Amber (WATCH 31-45d) / Red (STALE >45d).
 * The ring always renders the REAL days_stale from the envelope — honest stale
 * is a feature, fabricated fresh never happens here.
 * Hover / focus reveals a tooltip with exact days + verification date.
 */
export function FreshnessRing({
  status,
  daysStale,
  verifiedAt,
  size = 64,
  label,
}: {
  status: FreshnessStatus
  daysStale: number | null
  verifiedAt: string | null
  size?: number
  label: ReactNode
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const id = useId()

  const R = 26
  const C = 2 * Math.PI * R
  const pct = daysStale == null ? 100 : Math.min(daysStale / 45, 1) * 100
  const dash = C - (pct / 100) * C

  const theme = {
    fresh: {
      stroke: '#22c55e',
      soft: 'rgba(34,197,94,0.14)',
      text: 'text-[#16a34a]',
      label: t('trust.fresh'),
    },
    watch: {
      stroke: '#f59e0b',
      soft: 'rgba(245,158,11,0.14)',
      text: 'text-[#b45309]',
      label: t('trust.watch'),
    },
    stale: {
      stroke: '#ef4444',
      soft: 'rgba(239,68,68,0.14)',
      text: 'text-[#b91c1c]',
      label: t('trust.stale'),
    },
  }[status]

  const dayText = daysStale == null ? '?' : `${Math.round(daysStale)}d`

  return (
    <span
      className="relative inline-flex shrink-0"
      // Hover tooltip on pointer devices only. Guarding on pointerType means a
      // synthesized mouseenter from a touch tap can't pre-open the tooltip and
      // then have the click toggle it straight back closed.
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setOpen(false)
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      // Touch fallback: tap toggles the tooltip instead of opening the card drawer.
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        setOpen((v) => !v)
      }}
    >
      <span
        className="relative inline-flex items-center justify-center rounded-full"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          role="img"
          aria-label={formatT(t, 'trust.ringAria', { label: theme.label, days: dayText })}
          className="-rotate-90"
        >
          <circle cx="32" cy="32" r={R} fill="none" stroke={theme.soft} strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            stroke={theme.stroke}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dash}
            className="freshness-ring-progress"
          />
        </svg>
        <span
          className={`absolute inset-0 flex flex-col items-center justify-center leading-none font-mono font-bold ${theme.text}`}
        >
          <span style={{ fontSize: Math.max(13, size * 0.2) }}>{dayText}</span>
        </span>
      </span>

      {open && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-max max-w-[16rem] -translate-x-1/2 whitespace-normal rounded-mp-lg border border-mp-border-strong/60 bg-mp-card/95 px-3 py-2 text-left font-body text-[11px] leading-relaxed text-mp-ink-secondary shadow-mp-3 backdrop-blur-md"
        >
          <span className={`font-mono font-semibold uppercase tracking-wide ${theme.text}`}>
            {theme.label}
          </span>
          {daysStale == null ? (
            <span className="block mt-0.5">{t('trust.noDate')}</span>
          ) : (
            <>
              <span className="block mt-0.5">
                {formatT(t, 'trust.lastChecked', { date: verifiedAt ?? '—', days: Math.round(daysStale) })}
              </span>
              {status === 'fresh' && <span className="block mt-1 opacity-90">{t('trust.freshExplain')}</span>}
              {status === 'watch' && <span className="block mt-1 opacity-90">{t('trust.watchExplain')}</span>}
              {status === 'stale' && <span className="block mt-1 opacity-90">{t('trust.staleExplain')}</span>}
            </>
          )}
        </span>
      )}

      <span className="sr-only">{label}</span>
    </span>
  )
}
