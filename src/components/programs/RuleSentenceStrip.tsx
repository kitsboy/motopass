import { useEffect, useState } from 'react'
import type { Program } from '../../types/program'
import { loadSourceEvents } from '../../hooks/useSourceMonitor'
import { latestRuleSentences, type RuleSentence } from '../../lib/ruleSentence'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

/**
 * The before-and-after the probe already stored. Nothing here is a fresh probe,
 * and a sentence is not "changed today" unless the catalog latch says so.
 */
export function RuleSentenceStrip({ programs }: { programs: Program[] }) {
  const { t } = useI18n()
  const [sentences, setSentences] = useState<RuleSentence[] | null>(null)

  useEffect(() => {
    let live = true
    loadSourceEvents().then(events => {
      if (live) setSentences(latestRuleSentences(events, programs))
    })
    return () => {
      live = false
    }
  }, [programs])

  const rows = sentences ?? []
  const quiet = programs.length - rows.length

  return (
    <section className="mb-8 rounded-mp-lg border border-mp-border bg-section/40 p-4 sm:p-5" aria-labelledby="sentence-heading">
      <span className="club-eyebrow mb-1.5 block">{t('sentence.eyebrow')}</span>
      <h2 id="sentence-heading" className="font-display text-h3 font-semibold tracking-tight text-ink">
        {t('sentence.title')}
      </h2>
      <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-ink-secondary">{t('sentence.lead')}</p>
      {sentences && rows.length === 0 && (
        <p className="mt-3 text-sm text-mp-ink-secondary">{t('sentence.none')}</p>
      )}
      <ul className="mt-4 space-y-3">
        {rows.map(sentence => (
          <li key={`${sentence.country}-${sentence.date}`} className="border-t border-mp-border-subtle pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-mp-ink">{sentence.country}</span>
              <span className="font-mono text-[10px] text-mp-ink-tertiary">
                {sentence.date}
                {' · '}
                {sentence.markedChanged ? t('sentence.marked') : t('sentence.notMarked')}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-mp-ink">{sentence.added}</p>
            <a href={sentence.url} target="_blank" rel="noreferrer" className="mt-1 block truncate font-mono text-[10px] text-mp-ink-tertiary underline-offset-2 hover:underline">
              {sentence.url}
            </a>
          </li>
        ))}
      </ul>
      {rows.length > 0 && (
        <p className="mt-3 text-[11px] text-mp-ink-tertiary">
          {formatT(t, 'sentence.quiet', { count: quiet })}
        </p>
      )}
    </section>
  )
}
