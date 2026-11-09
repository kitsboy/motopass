import { useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import type { Program } from '../../types/program'
import { changeBellNote, changeBellPayload, changeBellReport } from '../../lib/changeBell'
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
  const [copied, setCopied] = useState<'note' | 'payload' | null>(null)
  const when = report.latestProbe?.slice(0, 10) ?? t('bell.unknownDate')

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
            {report.changed.length
              ? formatT(t, 'bell.changed', { count: report.changed.length, names: report.changed.map(country => country.name).join(', ') })
              : formatT(t, 'bell.quiet', { count: report.steady, date: when })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="chip text-xs"
            onClick={() => copy('note', changeBellNote(report))}
          >
            {copied === 'note' ? t('bell.copied') : t('bell.copyNote')}
          </button>
          <button
            type="button"
            className="chip text-xs"
            onClick={() => copy('payload', JSON.stringify(changeBellPayload(report), null, 2))}
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
      <p className="mt-3 text-[11px] leading-relaxed text-mp-ink-tertiary">{t('bell.hint')}</p>
    </section>
  )
}
