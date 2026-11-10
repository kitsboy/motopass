import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import type { Program } from './types'
import { useI18n } from '../../i18n/I18nContext'
import { factTotals, programFacts } from '../../lib/factCoverage'
import { evidenceFor, factLabel, sourceHost } from '../../lib/factEvidence'
import {
  loadSnapshotIndex,
  shortHash,
  snapshotFor,
  verifySnapshot,
  type SnapshotEntry,
  type SnapshotIndex,
} from '../../lib/snapshotProof'
import { GapBounty } from '../lightning/GapBounty'
import { LedgerPublish } from '../nostr/LedgerPublish'

/**
 * Evidence for every fact, and the layer-2 tools around it.
 *
 * The rules the panel enforces: a date comes from the audit row that wrote the
 * fact, never from the page; an archived snapshot is re-hashed in the browser
 * before it is called verified; a gap is shown as a gap and can be funded, but
 * funding never fills it.
 */

type Verdict = 'verifying' | 'verified' | 'unreproducible'

function citation(factKey: string, date: string | null, source: string | null, snapshot: SnapshotEntry | null): string {
  const parts = [`- **${factLabel(factKey)}**`]
  parts.push(date ? `· ${date}` : '· no audit row')
  if (source) parts.push(`· ${source}`)
  if (snapshot) parts.push(`· sha256:${snapshot.hash}`)
  return parts.join(' ')
}

export function EvidencePanel({ program, onClose }: { program: Program; onClose: () => void }) {
  const { t } = useI18n()
  const [index, setIndex] = useState<SnapshotIndex | null>(null)
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [openGap, setOpenGap] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void loadSnapshotIndex().then(loaded => {
      if (alive) setIndex(loaded)
    })
    return () => {
      alive = false
    }
  }, [])

  const rows = useMemo(
    () =>
      programFacts(program).map(fact => {
        const evidence = evidenceFor(program, fact.key)
        const snapshot = snapshotFor(index, evidence?.source ?? null)
        return { ...fact, evidence, snapshot }
      }),
    [program, index],
  )

  const totals = factTotals(program)
  const undated = rows.filter(row => row.have && !row.evidence).length
  const pct = totals.total > 0 ? Math.round((totals.have / totals.total) * 100) : 0

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(current => (current === key ? null : current)), 2000)
    } catch {
      setCopiedKey(null)
    }
  }

  const verify = async (key: string, snapshot: SnapshotEntry) => {
    setVerdicts(current => ({ ...current, [key]: 'verifying' }))
    const ok = await verifySnapshot(snapshot.text, snapshot.hash)
    // Some archives kept an excerpt rather than the exact hashed payload. A
    // failed re-hash reports "digest only" — never "tampered".
    setVerdicts(current => ({ ...current, [key]: ok ? 'verified' : 'unreproducible' }))
  }

  return (
    <div className="space-y-4">
      <p className="text-xs card-muted leading-relaxed">{t('modal.evidenceIntro')}</p>

      <div className="rounded-mp-md border border-mp-border bg-section/40 p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-[11px] text-mp-ink">
            {totals.have} / {totals.total} facts on file
          </span>
          <span className="font-mono text-[10px] text-mp-ink-tertiary">
            {totals.missing.length} missing
            {undated > 0 ? ` · ${undated} without a dated row` : ''}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-mp-border"
          role="img"
          aria-label={`${totals.have} of ${totals.total} facts on file`}
        >
          <div className="h-full rounded-full bg-mp-btc" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {rows.some(row => row.snapshot) && (
        <p className="text-[10px] leading-relaxed text-mp-ink-tertiary">
          A digest is what the source probe recorded. Where the archive kept only an excerpt, clicking
          the digest reports <span className="font-mono">digest only</span> — an unverifiable
          excerpt, not a changed source.
        </p>
      )}

      <ul className="text-sm">
        {rows.map(row => {
          const host = sourceHost(row.evidence?.source ?? null)
          const verdict = verdicts[row.key]
          const isOpen = openGap === row.key
          return (
            <li
              key={row.key}
              className="border-t border-mp-border-subtle py-2 first:border-t-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className={`font-mono text-[11px] ${row.have ? 'text-mp-ink' : 'text-mp-ink-tertiary'}`}>
                  {factLabel(row.key)}
                </span>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {row.have ? (
                    row.evidence?.source ? (
                      <a
                        href={row.evidence.source}
                        target="_blank"
                        rel="noreferrer"
                        title={row.evidence.source}
                        className="font-mono text-[10px] text-mp-ink-tertiary underline-offset-2 hover:underline"
                      >
                        {row.evidence.date} · {host} ↗
                      </a>
                    ) : row.evidence ? (
                      <span className="font-mono text-[10px] text-mp-ink-tertiary">{row.evidence.date}</span>
                    ) : (
                      <span className="font-mono text-[10px] text-mp-wax">{t('modal.evidenceUndated')}</span>
                    )
                  ) : (
                    <span className="font-mono text-[10px] text-mp-wax">{t('modal.evidenceMissing')}</span>
                  )}

                  {row.snapshot && (
                    <button
                      type="button"
                      onClick={() => void verify(row.key, row.snapshot as SnapshotEntry)}
                      title={
                        verdict === 'unreproducible'
                          ? `The archive kept an excerpt, so it does not reproduce the recorded digest sha256:${row.snapshot.hash}. The digest is what the source probe recorded.`
                          : `Archived text re-hashed in your browser — sha256:${row.snapshot.hash}`
                      }
                      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9px] transition-colors ${
                        verdict === 'verified'
                          ? 'border-mp-proof/40 text-mp-proof'
                          : 'border-mp-border text-mp-ink-tertiary hover:border-mp-btc/40 hover:text-mp-btc-text'
                      }`}
                    >
                      {verdict === 'verified' ? <Check size={9} aria-hidden="true" /> : null}
                      {verdict === 'verifying'
                        ? 'hashing…'
                        : verdict === 'verified'
                          ? `sha256:${shortHash(row.snapshot.hash)} ✓`
                          : verdict === 'unreproducible'
                            ? 'digest only'
                            : `sha256:${shortHash(row.snapshot.hash)}`}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      void copy(
                        row.key,
                        citation(row.key, row.evidence?.date ?? null, row.evidence?.source ?? null, row.snapshot),
                      )
                    }
                    aria-label={`Copy ${factLabel(row.key)} citation`}
                    title="Copy as Markdown"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-mp-ink-tertiary hover:text-mp-btc-text"
                  >
                    {copiedKey === row.key ? <Check size={10} aria-hidden="true" /> : <Copy size={10} aria-hidden="true" />}
                  </button>

                  {!row.have && (
                    <button
                      type="button"
                      onClick={() => setOpenGap(isOpen ? null : row.key)}
                      aria-expanded={isOpen}
                      className="rounded-full border border-mp-btc/40 px-2 py-0.5 font-chrome text-[10px] font-semibold text-mp-btc-text hover:bg-mp-btc/10"
                    >
                      {isOpen ? 'Hide' : 'Fund gap'}
                    </button>
                  )}
                </div>
              </div>

              {isOpen && <GapBounty factKey={row.key} programName={program.country} />}
            </li>
          )
        })}
      </ul>

      <p className="text-xs card-muted leading-relaxed">
        {t('modal.evidenceMissingNote')}{' '}
        <Link to="/agents#agents-paige" className="text-accent hover:underline" onClick={onClose}>
          {t('modal.evidenceAskPaige')}
        </Link>
      </p>

      <LedgerPublish program={program} />
    </div>
  )
}
