import { Activity, AlertTriangle, CheckCircle2, Radio, RefreshCw } from 'lucide-react'
import { useIntel, type IntelChange } from '../../hooks/useIntel'
import { safeSatohashHref } from '../../lib/satohash'

interface IntelWatchStripProps {
  variant?: 'full' | 'ticker'
}

function recentChangesAcross(intel: NonNullable<ReturnType<typeof useIntel>['intel']>): Array<IntelChange & { program: string }> {
  const all: Array<IntelChange & { program: string }> = []
  for (const [program, entry] of Object.entries(intel.programs)) {
    for (const change of entry.recent_changes) {
      all.push({ ...change, program })
    }
  }
  return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
}

function sweptTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}

/** Daily Country Intel watch — sweep counts, flags, and anchored change feed. */
export function IntelWatchStrip({ variant = 'full' }: IntelWatchStripProps) {
  const { intel, loading } = useIntel()
  if (loading || !intel) return null

  const { sweep, programs } = intel
  const entries = Object.values(programs)
  const flagged = entries.filter(e => e.watch.changed)
  const resyncing = entries.filter(e => !e.proof.in_sync)
  const changes = recentChangesAcross(intel)
  const apiUp = sweep.satohash_api?.status === 'up'

  if (variant === 'ticker') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-chip border border-mp-border/60 bg-mp-section/60 px-3 py-1.5 font-mono text-[10px] text-mp-ink-secondary">
        <span className="inline-flex items-center gap-1 text-mp-ink-muted uppercase tracking-wide">
          <Activity size={10} aria-hidden="true" /> Intel
        </span>
        <span>{sweep.fresh} fresh · {sweep.watch} watch · {sweep.stale} stale</span>
        {flagged.length > 0 && (
          <span className="inline-flex items-center gap-1 text-mp-btc-text">
            <AlertTriangle size={10} aria-hidden="true" /> {flagged.length} source {flagged.length === 1 ? 'change' : 'changes'}
          </span>
        )}
        {resyncing.length > 0 && (
          <span className="inline-flex items-center gap-1 text-mp-wax">
            <RefreshCw size={10} aria-hidden="true" /> {resyncing.length} re-anchoring
          </span>
        )}
        <span className="text-mp-ink-muted">swept {sweptTime(sweep.swept_at)} daily</span>
      </div>
    )
  }

  return (
    <section aria-label="Country intel watch" className="rounded-panel border border-mp-border/60 bg-mp-card p-4 shadow-mp-1 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-chrome text-xs font-semibold uppercase tracking-wide text-mp-ink-tertiary inline-flex items-center gap-2">
          <Activity size={13} aria-hidden="true" /> Country intel watch
        </h2>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-mp-ink-muted">
          <span
            className={`inline-flex items-center gap-1 rounded-chip border px-2 py-0.5 ${
              apiUp ? 'border-mp-proof/30 bg-mp-proof/10 text-mp-proof' : 'border-mp-wax/40 bg-mp-wax/10 text-mp-wax'
            }`}
          >
            <Radio size={9} aria-hidden="true" /> Satohash {apiUp ? 'API up' : 'API unreachable'}
          </span>
          <span>swept {sweptTime(sweep.swept_at)} daily</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [sweep.fresh, 'fresh', 'text-mp-proof'],
          [sweep.watch, 'watch', 'text-mp-btc-text'],
          [sweep.stale, 'stale', 'text-mp-ink-tertiary'],
          [flagged.length, 'source changes flagged', 'text-mp-btc-text'],
        ].map(([count, label, color]) => (
          <div key={String(label)} className="rounded-mp-md border border-mp-border/50 bg-mp-section/50 px-3 py-2">
            <div className={`font-display text-lg2 font-semibold ${color}`}>{count}</div>
            <div className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-muted">{label}</div>
          </div>
        ))}
      </div>

      {resyncing.length > 0 && (
        <p className="mt-2 text-[11px] text-mp-ink-muted inline-flex items-center gap-1.5">
          <RefreshCw size={11} aria-hidden="true" />
          {resyncing.length} proof{resyncing.length === 1 ? '' : 's'} re-anchoring on Bitcoin — converges on the next daily sweep.
        </p>
      )}

      {changes.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
            Recently anchored changes
          </h3>
          <ul className="space-y-1.5">
            {changes.map((c, i) => {
              const verifyHref = safeSatohashHref(c.hash ? `https://satohash.io/verify/${c.hash}` : undefined)
              return (
                <li key={`${c.program}-${c.date}-${i}`} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-mp-ink-secondary">
                  <span className="font-mono text-mp-ink-muted">{c.date}</span>
                  <span className="font-medium text-mp-ink">{c.program}</span>
                  <span className="truncate text-mp-ink-muted">{c.field}: {c.to}</span>
                  {verifyHref && (
                    <a href={verifyHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-mp-btc-text hover:underline underline-offset-2">
                      <CheckCircle2 size={10} aria-hidden="true" /> verify
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
