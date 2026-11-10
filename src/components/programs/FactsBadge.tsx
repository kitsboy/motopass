import { formatT } from '../../i18n/format'
import { useI18n } from '../../i18n/I18nContext'
import { programFacts, factTotals } from '../../lib/factCoverage'
import { evidenceFor, factLabel, sourceHost } from '../../lib/factEvidence'
import type { Program } from './types'

/**
 * "22/23" — the record's own completeness, and the age of the evidence behind
 * each fact. Expandable in the table (where there is room for a list); a plain
 * tooltipped badge on the card, which is itself a button and cannot nest another
 * interactive element.
 */
export function FactsBadge({
  program,
  expandable = false,
  onOpenEvidence,
}: {
  program: Program
  expandable?: boolean
  /** Card badge: open the modal's Evidence tab instead of a popover that the card clips. */
  onOpenEvidence?: () => void
}) {
  const { t } = useI18n()
  const facts = programFacts(program)
  const { have, total, missing } = factTotals(program)
  const complete = have === total
  const summary = formatT(t, 'programs.factsOnFile', { have, total })
  const title = complete ? summary : `${summary} — ${missing.join(', ')}`
  const tone = complete
    ? 'border-mp-border text-mp-ink-secondary'
    : 'border-mp-wax/40 text-mp-wax'
  const badge = (
    <span
      className={`inline-flex items-center rounded-chip border px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${tone}`}
    >
      {have}/{total}
    </span>
  )

  if (onOpenEvidence) {
    return (
      <button
        type="button"
        title={t('programs.factsHint')}
        aria-label={`${title} — ${t('modal.tabEvidence')}`}
        onClick={event => {
          event.stopPropagation()
          onOpenEvidence()
        }}
        className="rounded-chip focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mp-btc"
      >
        {badge}
      </button>
    )
  }

  if (!expandable) {
    return (
      <span title={title} aria-label={summary}>
        {badge}
      </span>
    )
  }

  return (
    <details
      className="relative inline-block"
      onClick={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
    >
      <summary
        className="list-none cursor-pointer rounded-chip focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mp-btc"
        title={t('programs.factsHint')}
        aria-label={title}
      >
        {badge}
      </summary>
      <div className="absolute end-0 z-30 mt-1 w-72 rounded-md border border-mp-border bg-mp-card p-2 text-start shadow-mp-2">
        <p className="mb-1 font-chrome text-[9px] uppercase tracking-wide text-mp-ink-tertiary">{summary}</p>
        <ul className="max-h-64 space-y-0.5 overflow-auto">
          {facts.map(fact => {
            const evidence = evidenceFor(program, fact.key)
            const host = sourceHost(evidence?.source ?? null)
            return (
              <li
                key={fact.key}
                className="flex items-baseline justify-between gap-2 border-t border-mp-border-subtle py-0.5 first:border-t-0"
              >
                <span
                  className={`min-w-0 truncate font-mono text-[10px] ${
                    fact.have ? 'text-mp-ink' : 'text-mp-ink-tertiary line-through'
                  }`}
                >
                  {factLabel(fact.key)}
                </span>
                {fact.have && evidence ? (
                  evidence.source ? (
                    <a
                      href={evidence.source}
                      target="_blank"
                      rel="noreferrer"
                      title={evidence.source}
                      className="shrink-0 font-mono text-[9px] text-mp-ink-tertiary underline-offset-2 hover:underline"
                    >
                      {evidence.date} · {host}
                    </a>
                  ) : (
                    <span className="shrink-0 font-mono text-[9px] text-mp-ink-tertiary">{evidence.date}</span>
                  )
                ) : (
                  <span className="shrink-0 font-mono text-[9px] text-mp-ink-tertiary">{fact.have ? '✓' : '—'}</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </details>
  )
}
