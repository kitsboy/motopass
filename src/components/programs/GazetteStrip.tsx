import { useMemo } from 'react'
import type { Program } from '../../types/program'
import { gazetteHits, gazetteLine } from '../../lib/gazetteWatch'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

function lineFor(program: Program) {
  return gazetteLine(gazetteHits({
    sources: program.sources,
    officialUrls: program.legal_compliance?.official_urls,
    watchUrls: program.watch?.urls,
  }))
}

/** Names the gazettes already on file. It does not add a URL or claim a page changed. */
export function GazetteStrip({ programs }: { programs: Program[] }) {
  const { t } = useI18n()
  const groups = useMemo(() => {
    const watched: string[] = []
    const cited: string[] = []
    let missing = 0
    for (const program of programs) {
      const line = lineFor(program)
      if (line === 'watched' || line === 'changed') watched.push(program.name)
      else if (line === 'cited') cited.push(program.name)
      else missing += 1
    }
    return { watched, cited, missing }
  }, [programs])

  return (
    <section className="mb-8" aria-labelledby="gazette-strip-heading">
      <span className="club-eyebrow mb-1.5 block">{t('gazette.eyebrow')}</span>
      <h2 id="gazette-strip-heading" className="font-display text-h3 font-semibold tracking-tight text-ink">
        {t('gazette.title')}
      </h2>
      <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-ink-secondary">
        {formatT(t, 'gazette.summary', {
          watched: groups.watched.join(', ') || t('gazette.noneListed'),
          cited: groups.cited.join(', ') || t('gazette.noneListed'),
          missing: groups.missing,
        })}
      </p>
    </section>
  )
}
