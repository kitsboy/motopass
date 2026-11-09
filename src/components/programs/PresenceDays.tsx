import { useMemo } from 'react'
import type { Program } from '../../types/program'
import { presenceRows, presenceScale } from '../../lib/presenceDays'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { CountryFlag } from '../ui/CountryTitle'

/**
 * Days the program asks for, drawn against the longest count on file.
 * The marks are 365-day steps on that scale, not a calendar you can book.
 */
export function PresenceDays({ programs }: { programs: Program[] }) {
  const { t } = useI18n()
  const rows = useMemo(() => presenceRows(programs), [programs])
  const scale = presenceScale(rows)
  const measured = rows.filter(row => row.days != null && row.days > 0)
  const none = rows.filter(row => row.days === 0)
  const missing = rows.filter(row => row.days == null)
  const marks = [1, 2, 5, 10].filter(year => year * 365 < scale)

  return (
    <section className="mb-8 rounded-mp-lg border border-mp-border bg-section/40 p-4 sm:p-5" aria-labelledby="days-heading">
      <span className="club-eyebrow mb-1.5 block">{t('days.eyebrow')}</span>
      <h2 id="days-heading" className="font-display text-h3 font-semibold tracking-tight text-ink">
        {t('days.title')}
      </h2>
      <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-ink-secondary">{t('days.lead')}</p>

      <div className="relative mt-4 h-4">
        {marks.map(year => (
          <span
            key={year}
            className="absolute top-0 font-mono text-[10px] text-mp-ink-tertiary"
            style={{ left: `${(year * 365 / scale) * 100}%` }}
          >
            {formatT(t, 'days.yearMark', { years: year })}
          </span>
        ))}
      </div>

      <ul className="mt-2 space-y-2">
        {measured.map(row => (
          <li key={row.name}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm text-mp-ink">
                <CountryFlag name={row.name} emoji={row.flag} size="sm" />
                <span className="min-w-0">{row.name}</span>
              </span>
              <span className="shrink-0 font-mono text-xs text-mp-ink">{row.days?.toLocaleString('en-US')}d</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-mp-border">
              <div
                className="h-full rounded-full bg-mp-btc"
                style={{ width: `${Math.max(1.5, ((row.days ?? 0) / scale) * 100)}%` }}
              />
            </div>
            <details className="mt-1">
              <summary className="cursor-pointer font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
                {t('days.receipt')}
              </summary>
              <p className="mt-1 text-xs leading-relaxed text-mp-ink-secondary">{row.sentence ?? t('days.noSentence')}</p>
              {row.url && (
                <a
                  href={row.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate font-mono text-[10px] text-mp-ink-tertiary underline-offset-2 hover:underline"
                >
                  {row.url}
                </a>
              )}
            </details>
          </li>
        ))}
      </ul>

      {none.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-mp-ink-secondary">
          <span className="font-medium text-mp-ink">{t('days.none')}: </span>
          {none.map(row => row.name).join(', ')}
        </p>
      )}
      {missing.length > 0 && (
        <p className="mt-1 text-xs leading-relaxed text-mp-ink-tertiary">
          <span className="font-medium">{t('days.notOnFile')}: </span>
          {missing.map(row => row.name).join(', ')}
        </p>
      )}
    </section>
  )
}
