import { useEffect, useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import type { Program } from '../../types/program'
import { changeBellNote, changeBellPayload, changeBellReport } from '../../lib/changeBell'
import { latestRuleSentences } from '../../lib/ruleSentence'
import { loadSourceEvents } from '../../hooks/useSourceMonitor'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

/**
 * The three doors of the change bell: the sentence on this page, a Nostr note
 * the visitor copies, and the webhook body the daily script can post.
 * Nothing is published from the browser.
 */
export function ChangeBellPanel({ programs }: { programs: Program[] }) {
  const { t } = useI18n()
  const report = useMemo(() => changeBellReport(programs), [programs])
  const [sentences, setSentences] = useState<ReturnType<typeof latestRuleSentences>>([])
  const [copied, setCopied] = useState<'note' | 'payload' | null>(null)
  const [countryName, setCountryName] = useState('')
  const [deliverUrl, setDeliverUrl] = useState('')
  const [nostrKey, setNostrKey] = useState('')
  const when = report.latestProbe?.slice(0, 10) ?? t('bell.unknownDate')
  const scopedPrograms = countryName ? programs.filter(program => program.name === countryName) : programs
  const scopedReport = countryName ? changeBellReport(scopedPrograms) : report

  useEffect(() => {
    let live = true
    loadSourceEvents().then(events => {
      if (live) setSentences(latestRuleSentences(events, programs))
    })
    return () => {
      live = false
    }
  }, [programs])

  const scopedSentences = countryName ? sentences.filter(sentence => sentence.country === countryName) : sentences
  const sentenceLines = scopedSentences.map(sentence => `${sentence.country} (${sentence.date}): ${sentence.added}`)
  const deliveryLines = [
    nostrKey.trim() ? `Nostr pubkey: ${nostrKey.trim()}` : '',
    deliverUrl.trim() ? `Deliver to (not sent from this page): ${deliverUrl.trim()}` : '',
  ].filter(Boolean)
  const note = [
    changeBellNote(scopedReport),
    sentenceLines.length ? `Stored sentences:\n${sentenceLines.join('\n')}` : '',
    deliveryLines.join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n')
  const payload = {
    ...changeBellPayload(scopedReport),
    sentences: scopedSentences.map(sentence => ({
      country: sentence.country,
      date: sentence.date,
      url: sentence.url,
      added: sentence.added,
      marked_changed: sentence.markedChanged,
    })),
    nostr_pubkey: nostrKey.trim() || null,
    deliver_to: deliverUrl.trim() || null,
  }

  async function copy(kind: 'note' | 'payload', text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
    } catch {
      setCopied(null)
    }
  }

  return (
    <section className="mb-8 rounded-mp-lg border border-mp-border bg-section/40 p-4 sm:p-5" aria-labelledby="change-bell-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="club-eyebrow mb-1.5 flex items-center gap-1.5">
            <Bell size={12} aria-hidden="true" />
            {t('bell.eyebrow')}
          </span>
          <h2 id="change-bell-heading" className="font-display text-h3 font-semibold tracking-tight text-ink">
            {t('bell.title')}
          </h2>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-ink-secondary">
            {report.changed.length > 0 ? (
              <>
                <span className="font-semibold text-mp-wax">{report.changed.length}</span>
                {' '}
                {formatT(t, 'bell.changedRest', { names: report.changed.map(country => country.name).join(', ') })}
              </>
            ) : (
              formatT(t, 'bell.quiet', { count: report.steady, date: when })
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="chip text-xs"
            onClick={() => copy('note', note)}
          >
            {copied === 'note' ? t('bell.copied') : t('bell.copyNote')}
          </button>
          <button
            type="button"
            className="chip text-xs"
            onClick={() => copy('payload', JSON.stringify(payload, null, 2))}
          >
            {copied === 'payload' ? t('bell.copied') : t('bell.copyPayload')}
          </button>
        </div>
      </div>
      {report.changed.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-mp-ink-secondary">
          {report.changed.map(country => (
            <li key={country.name}>
              <span className="font-medium text-mp-ink">{country.name}</span>
              {country.changedPages.map(page => (
                <span key={page.url} className="mt-0.5 block font-mono text-[10px] text-mp-wax">
                  {page.url}
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <label className="text-[11px] text-mp-ink-tertiary">
          {t('bell.country')}
          <select
            className="mt-1 w-full rounded-mp-md border border-mp-border bg-transparent px-2 py-1.5 text-sm text-mp-ink"
            value={countryName}
            onChange={event => setCountryName(event.target.value)}
          >
            <option value="">{t('bell.allCountries')}</option>
            {programs.map(program => (
              <option key={program.id} value={program.name}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-mp-ink-tertiary">
          {t('bell.deliverUrl')}
          <input
            className="mt-1 w-full rounded-mp-md border border-mp-border bg-transparent px-2 py-1.5 text-sm text-mp-ink"
            value={deliverUrl}
            onChange={event => setDeliverUrl(event.target.value)}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="text-[11px] text-mp-ink-tertiary">
          {t('bell.deliverKey')}
          <input
            className="mt-1 w-full rounded-mp-md border border-mp-border bg-transparent px-2 py-1.5 text-sm text-mp-ink"
            value={nostrKey}
            onChange={event => setNostrKey(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-mp-ink-tertiary">{t('bell.hint')}</p>
    </section>
  )
}
