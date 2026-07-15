import { useMemo, useState } from 'react'
import { ChevronDown, Loader2, Printer, Search, ShieldCheck } from 'lucide-react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import type { LaunchGate, LaunchGateReport } from '../../lib/launch/launchGates'
import { BUILD_ID } from '../../lib/buildInfo'

type GateFilter = 'all' | 'pass' | 'pending'

function gateBlockers(g: LaunchGate): string[] {
  if (g.blockers?.length) return g.blockers
  if (!g.pass && g.detail) return [g.detail]
  return []
}

export function ApplyLaunchGatesDirectory({
  report,
  loading,
  applicationsOpen,
}: {
  report: LaunchGateReport
  loading: boolean
  applicationsOpen: boolean
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [gateFilter, setGateFilter] = useState<GateFilter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 120)

  const passed = report.gates.filter(g => g.pass).length

  const filtered = useMemo(() => {
    let gates = report.gates
    if (gateFilter === 'pass') gates = gates.filter(g => g.pass)
    if (gateFilter === 'pending') gates = gates.filter(g => !g.pass)
    if (!debounced) return gates
    return gates.filter(g => {
      const hay = [g.id, g.pillar, g.name, g.detail].join(' ').toLowerCase()
      return hay.includes(debounced)
    })
  }, [report.gates, gateFilter, debounced])

  const filterChips: { id: GateFilter; label: string }[] = [
    { id: 'all', label: t('apply.gatesFilterAll') },
    { id: 'pass', label: t('apply.gatesFilterPass') },
    { id: 'pending', label: t('apply.gatesFilterPending') },
  ]

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const printSummary = () => {
    window.print()
  }

  return (
    <div className="apply-gates-print flex flex-col min-h-0" aria-labelledby="apply-gates-heading">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-mp/50 space-y-3">
        <div className="flex items-start gap-2 min-w-0">
          <ShieldCheck size={16} className="text-mp-proof shrink-0 mt-0.5" aria-hidden />
          <div className="flex-1 min-w-0">
            <h2 id="apply-gates-heading" className="font-chrome text-sm font-semibold text-ink truncate">
              {t('apply.gatesHeading')}
            </h2>
            <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{t('apply.gatesSub')}</p>
          </div>
          {applicationsOpen && (
            <span className="rounded-chip border border-btc-orange/35 bg-btc-orange-soft/50 text-mp-btc-text text-[10px] font-mono px-2 py-0.5 shrink-0">
              OPEN · {passed}/{report.gates.length}
            </span>
          )}
        </div>

        <div className="relative apply-gates-no-print">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('apply.searchGates')}
            className="input-field w-full !py-2 !pl-9 !pr-3 text-xs font-chrome"
            aria-label={t('apply.searchGates')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 apply-gates-no-print">
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {filterChips.map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setGateFilter(chip.id)}
                className={`rounded-chip border px-2.5 py-1 text-[10px] font-chrome transition-all duration-fast ${
                  gateFilter === chip.id
                    ? 'border-btc-orange/35 bg-btc-orange-soft/60 text-mp-btc-text shadow-mp-1'
                    : 'border-mp/70 text-ink-muted hover:border-btc-orange/25 hover:text-ink'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={printSummary}
            className="btn-secondary text-xs inline-flex items-center gap-1.5 shrink-0 !py-1.5 !px-2.5"
            aria-label={t('apply.gatesPrintSummary')}
          >
            <Printer size={13} aria-hidden />
            {t('apply.gatesPrintSummary')}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          <span>
            {loading
              ? t('apply.gatesLoading')
              : formatT(t, 'apply.gatesCount', { passed, total: report.gates.length })}
          </span>
          {debounced && filtered.length !== report.gates.length && (
            <span className="text-ink-muted/80 normal-case tracking-normal font-body apply-gates-no-print">
              {filtered.length} of {report.gates.length}
            </span>
          )}
        </div>

        <p className="hidden apply-gates-print-only text-xs text-ink-muted font-mono">
          {report.generated_at ? new Date(report.generated_at).toLocaleString() : '—'} · {report.build_id} ·{' '}
          {formatT(t, 'apply.gatesCount', { passed, total: report.gates.length })}
        </p>
      </div>

      <div className="max-h-[min(320px,45vh)] min-h-[8rem] overflow-y-auto overscroll-contain px-2 py-2 btcmap-directory-scroll apply-gates-print-list">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-ink-muted font-mono px-3 py-6">
            <Loader2 size={14} className="animate-spin text-btc-orange" aria-hidden />
            {t('apply.gatesLoading')}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-ink-muted px-3 py-6">{t('apply.gatesEmpty')}</p>
        ) : (
          <ul className="divide-y divide-mp/40">
            {filtered.map((g: LaunchGate) => {
              const blockers = gateBlockers(g)
              const showWhy = !g.pass && blockers.length > 0
              const isOpen = expanded.has(g.id)
              const detailsId = `gate-blocked-${g.id}`

              return (
                <li key={g.id} className="group">
                  <div
                    className={`px-2 py-2.5 rounded-mp-md transition-colors ${
                      g.pass ? 'hover:bg-mp-proof/5' : 'hover:bg-section/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="font-mono font-semibold text-xs text-ink truncate">
                        {g.pass ? '✓' : '○'} {g.id} · {g.pillar}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider shrink-0 ${
                          g.pass ? 'text-mp-proof' : 'text-ink-muted'
                        }`}
                      >
                        {g.pass ? t('apply.gatePass') : t('apply.gatePending')}
                      </span>
                    </div>
                    <p className="font-chrome text-sm text-ink-secondary mt-0.5 truncate group-hover:text-ink transition-colors">
                      {g.name}
                    </p>
                    <p className="text-ink-muted font-mono text-[10px] mt-0.5 line-clamp-2 opacity-75">{g.detail}</p>

                    {showWhy && (
                      <div className="mt-2 apply-gates-no-print">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(g.id)}
                          aria-expanded={isOpen}
                          aria-controls={detailsId}
                          className="inline-flex items-center gap-1 text-[10px] font-chrome text-status-amber hover:text-ink transition-colors"
                        >
                          {t('apply.gateWhyBlocked')}
                          <ChevronDown
                            size={12}
                            className={`transition-transform duration-fast ${isOpen ? 'rotate-180' : ''}`}
                            aria-hidden
                          />
                        </button>
                        {isOpen && (
                          <ul id={detailsId} className="mt-1.5 space-y-1 pl-3 border-l border-status-amber/30">
                            {blockers.map((b, i) => (
                              <li key={i} className="text-[10px] font-mono text-ink-muted leading-relaxed">
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {showWhy && (
                      <ul className="hidden apply-gates-print-only mt-1 space-y-0.5 pl-3">
                        {blockers.map((b, i) => (
                          <li key={i} className="text-[10px] font-mono text-ink-muted">
                            — {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-mp/50 bg-card-muted/30">
        <p className="text-[10px] text-ink-muted font-mono break-all opacity-60">
          {BUILD_ID} · <code>npm run launch:gate</code>
        </p>
      </div>
    </div>
  )
}