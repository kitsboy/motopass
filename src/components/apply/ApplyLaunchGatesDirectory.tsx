import { useMemo, useState } from 'react'
import { Loader2, Search, ShieldCheck } from 'lucide-react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import type { LaunchGate, LaunchGateReport } from '../../lib/launch/launchGates'
import { BUILD_ID } from '../../lib/buildInfo'

type GateFilter = 'all' | 'pass' | 'pending'

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

  return (
    <div className="flex flex-col min-h-0" aria-labelledby="apply-gates-heading">
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

        <div className="relative">
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

        <div className="flex flex-wrap gap-1.5">
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

        <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          <span>
            {loading
              ? t('apply.gatesLoading')
              : formatT(t, 'apply.gatesCount', { passed, total: report.gates.length })}
          </span>
          {debounced && filtered.length !== report.gates.length && (
            <span className="text-ink-muted/80 normal-case tracking-normal font-body">
              {filtered.length} of {report.gates.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-h-[min(320px,45vh)] min-h-[8rem] overflow-y-auto overscroll-contain px-2 py-2 btcmap-directory-scroll">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-ink-muted font-mono px-3 py-6">
            <Loader2 size={14} className="animate-spin text-btc-orange" aria-hidden />
            {t('apply.gatesLoading')}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-ink-muted px-3 py-6">{t('apply.gatesEmpty')}</p>
        ) : (
          <ul className="divide-y divide-mp/40">
            {filtered.map((g: LaunchGate) => (
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
                </div>
              </li>
            ))}
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