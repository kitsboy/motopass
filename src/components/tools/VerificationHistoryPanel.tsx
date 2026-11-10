import { useEffect, useMemo, useState } from 'react'
import { GitCompare, History, Trash2 } from 'lucide-react'
import {
  VERIFICATION_HISTORY_EVENT,
  clearVerificationHistory,
  loadVerificationHistory,
  verificationAnchor,
  verificationHistoryStatus,
  type VerificationHistoryEntry,
} from '../../lib/verificationHistory'

const STATE_TONE = {
  pass: 'text-mp-proof',
  fail: 'text-mp-wax',
  unknown: 'text-mp-ink-tertiary',
} as const

const STATE_LABEL = { pass: 'pass', fail: 'fail', unknown: 'unchecked' } as const

function valueLabel(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function VerificationHistoryPanel() {
  const [entries, setEntries] = useState<VerificationHistoryEntry[]>(() => loadVerificationHistory())
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const reload = () => setEntries(loadVerificationHistory())
    window.addEventListener(VERIFICATION_HISTORY_EVENT, reload)
    window.addEventListener('storage', reload)
    return () => {
      window.removeEventListener(VERIFICATION_HISTORY_EVENT, reload)
      window.removeEventListener('storage', reload)
    }
  }, [])

  const selectedActive = selected
    .filter(id => entries.some(entry => entry.id === id))
    .slice(0, 2)

  const comparison = useMemo(() => {
    if (selectedActive.length !== 2) return null
    const a = entries.find(entry => entry.id === selectedActive[0])
    const b = entries.find(entry => entry.id === selectedActive[1])
    if (!a || !b) return null
    const labels = Array.from(new Set([...a.steps.map(step => step.label), ...b.steps.map(step => step.label)]))
    const fields = Array.from(
      new Set([...Object.keys(a.fields ?? {}), ...Object.keys(b.fields ?? {})]),
    ).sort()
    return {
      a,
      b,
      steps: labels.map(label => ({
        label,
        a: a.steps.find(step => step.label === label)?.state ?? null,
        b: b.steps.find(step => step.label === label)?.state ?? null,
      })),
      fields: fields
        .map(key => ({
          key,
          a: (a.fields ?? {})[key],
          b: (b.fields ?? {})[key],
        }))
        .filter(field => valueLabel(field.a) !== valueLabel(field.b)),
    }
  }, [entries, selectedActive])

  const toggle = (id: string) => {
    setSelected(previous => {
      if (previous.includes(id)) return previous.filter(item => item !== id)
      if (previous.length >= 2) return [previous[1], id]
      return [...previous, id]
    })
  }

  return (
    <details className="mb-5 rounded-mp-lg border border-mp-border-subtle bg-mp-card/30 p-3" open={entries.length > 0 && selected.length > 0}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 font-chrome text-[11px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
        <History size={13} aria-hidden="true" />
        Recent checks
        <span className="ml-auto rounded-full border border-mp-border-subtle px-2 py-0.5 text-[10px] normal-case tracking-wide text-mp-ink-tertiary">
          {entries.length} local
        </span>
      </summary>
      <p className="mt-2 text-[11px] leading-relaxed text-mp-ink-tertiary">
        Stored only in this browser. Receipts keep result metadata, never raw inputs or private keys. Select two to compare.
      </p>

      {entries.length === 0 ? (
        <p className="mt-2 text-[11px] text-mp-ink-tertiary">No checks recorded yet. Run any verification to start a local trail.</p>
      ) : (
        <>
          <div className="mt-2 space-y-1.5">
            {entries.slice(0, 6).map(entry => {
              const status = verificationHistoryStatus(entry)
              const active = selectedActive.includes(entry.id)
              return (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 rounded-mp-md border p-2 ${active ? 'border-mp-proof-border bg-mp-proof/10' : 'border-mp-border-subtle bg-mp-canvas/40'}`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(entry.id)}
                    aria-pressed={active}
                    aria-label={`Select ${entry.title} for comparison`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-4 w-4 rounded-sm border ${active ? 'border-mp-proof bg-mp-proof' : 'border-mp-border-strong'}`}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <a
                        href={`#${verificationAnchor(entry.tool)}`}
                        className="text-[11px] font-semibold text-mp-ink hover:text-mp-btc-text hover:underline"
                      >
                        {entry.title}
                      </a>
                      <span className={`font-chrome text-[10px] uppercase tracking-wide ${STATE_TONE[status.tone]}`}>
                        {status.tone === 'pass' ? 'all checked' : status.tone === 'fail' ? 'failed' : `${status.unknown} unchecked`}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-mp-ink-tertiary">
                      {new Date(entry.generatedAt).toLocaleString()} · {entry.tool} · {status.pass} pass
                      {status.fail > 0 ? ` · ${status.fail} fail` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-mp-ink-tertiary">
              <GitCompare size={10} aria-hidden="true" />
              {selectedActive.length === 2 ? 'Comparison below' : `Select ${2 - selectedActive.length} more to compare`}
            </span>
            <button
              type="button"
              onClick={() => {
                clearVerificationHistory()
                setSelected([])
              }}
              className="ml-auto inline-flex min-h-9 items-center gap-1 font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary underline underline-offset-2 hover:text-mp-wax"
            >
              <Trash2 size={10} aria-hidden="true" />
              Clear local history
            </button>
          </div>

          {comparison && (
            <div className="mt-2 rounded-mp-md border border-mp-border-subtle p-2">
              <p className="text-[11px] font-semibold text-mp-ink">
                {comparison.a.title} <span className="text-mp-ink-tertiary">vs</span> {comparison.b.title}
              </p>
              <div className="mt-1.5 overflow-x-auto">
                <table className="w-full min-w-[280px] text-left text-[10px]">
                  <thead className="text-mp-ink-tertiary">
                    <tr>
                      <th className="py-0.5 pr-2 font-medium">Step</th>
                      <th className="py-0.5 pr-2 font-medium">A</th>
                      <th className="py-0.5 font-medium">B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.steps.map(step => (
                      <tr key={step.label} className="border-t border-mp-border-subtle/60">
                        <td className="py-0.5 pr-2 text-mp-ink-secondary">{step.label}</td>
                        <td className={`py-0.5 pr-2 ${step.a ? STATE_TONE[step.a] : 'text-mp-ink-tertiary'}`}>
                          {step.a ? STATE_LABEL[step.a] : 'missing'}
                        </td>
                        <td className={`py-0.5 ${step.b ? STATE_TONE[step.b] : 'text-mp-ink-tertiary'}`}>
                          {step.b ? STATE_LABEL[step.b] : 'missing'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {comparison.fields.length > 0 ? (
                <div className="mt-2 space-y-1">
                  <p className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">Changed fields</p>
                  {comparison.fields.map(field => (
                    <p key={field.key} className="break-words text-[10px] text-mp-ink-tertiary">
                      <span className="text-mp-ink-secondary">{field.key}:</span> {valueLabel(field.a)} → {valueLabel(field.b)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-mp-ink-tertiary">No generated field changed; compare the trail above.</p>
              )}
            </div>
          )}
        </>
      )}
    </details>
  )
}
