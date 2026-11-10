import { useMemo } from 'react'
import type { Program } from '../../types/program'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { feeStance } from '../../lib/decisionPack'

interface SelectionBoardProps {
  /** Programs currently matching every filter except region. */
  shown: Program[]
  regionCounts: Record<string, number>
  regionFilter: string
  onRegion: (region: string) => void
}

/**
 * The count line used to sit inside the results grid, below every board above it.
 * It now opens the page's information stack: the same live count, the region
 * spread, and how many of the shown programs carry each key fact.
 * Every number is a count of fields already in the catalog — nothing is inferred.
 */
export function SelectionBoard({ shown, regionCounts, regionFilter, onRegion }: SelectionBoardProps) {
  const { t } = useI18n()
  const total = shown.length
  const regions = useMemo(
    () => ['All', ...Object.keys(regionCounts).filter(region => region !== 'All').sort()],
    [regionCounts],
  )
  const flagshipRows = shown.filter(program => program.flagship_depth === true).length
  const sourcesOnFile = shown.reduce((sum, program) => sum + (program.sources?.length ?? 0), 0)
  const coverage = useMemo(
    () => [
      {
        label: t('pack.inCountryLong'),
        have: shown.filter(program => program.compliance_clock?.residency_day_count_target != null).length,
      },
      {
        label: t('pack.citizenshipLong'),
        have: shown.filter(program => program.compliance_clock?.citizenship_eligibility_years != null).length,
      },
      {
        label: t('pack.fee'),
        have: shown.filter(program => feeStance(program.finance?.bitcoin_specific) !== 'unknown').length,
      },
      {
        label: t('pack.mobility'),
        have: shown.filter(program => program.scorecard?.mobility != null).length,
      },
      {
        label: t('pack.banking'),
        have: shown.filter(program => program.scorecard?.banking != null).length,
      },
    ],
    [shown, t],
  )

  return (
    <section
      className="mb-8 rounded-mp-lg border border-mp-border bg-section/40 p-4 sm:p-5"
      aria-labelledby="selection-board-heading"
    >
      <span className="club-eyebrow mb-1.5 block">{t('board.eyebrow')}</span>
      <h2
        id="selection-board-heading"
        className="font-display text-h3 font-semibold tracking-tight text-ink"
        aria-live="polite"
        aria-atomic="true"
      >
        {formatT(t, 'programs.filterResults', { count: total })}
      </h2>
      <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-ink-secondary">{t('board.lead')}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={t('programs.region')}>
        {regions.map(region => {
          const active = regionFilter === region
          return (
            <button
              key={region}
              type="button"
              aria-pressed={active}
              onClick={() => onRegion(region)}
              className={`chip inline-flex items-center gap-2 text-xs ${active ? 'border-mp-btc/50 text-mp-btc-text' : ''}`}
            >
              {region === 'All' ? t('programs.all') : region}
              <span className="rounded-full bg-mp-section px-1.5 py-px font-mono text-[10px] tabular-nums text-mp-ink-tertiary">
                {regionCounts[region] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-chip border border-mp-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mp-ink-secondary">
          {formatT(t, 'pitch.hero.jurisdictionsChip', { count: total })}
        </span>
        <span className="inline-flex items-center rounded-chip border border-mp-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mp-ink-secondary">
          {formatT(t, 'pitch.hero.flagshipChip', { count: flagshipRows })}
        </span>
        <span className="inline-flex items-center rounded-chip border border-mp-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mp-ink-secondary">
          {formatT(t, 'programs.sourcesOnFile', { count: sourcesOnFile })}
        </span>
      </div>

      <div className="mt-4 border-t border-mp-border-subtle pt-3">
        <span className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{t('board.coverage')}</span>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-5">
          {coverage.map(item => (
            <div key={item.label}>
              <dt className="text-[11px] leading-snug text-mp-ink-tertiary">{item.label}</dt>
              <dd className="font-mono text-xs tabular-nums text-mp-ink">
                {item.have}/{total}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
