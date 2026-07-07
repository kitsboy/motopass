import { useEffect, useMemo, useState } from 'react'
import { loadCompareIds, saveCompareIds } from '../lib/portfolioStorage'
import { Search, X } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { PageHeader } from '../components/ui/PageHeader'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import type { Program } from '../types/program'

export function FinanceComparePage() {
  const { t } = useI18n()
  const { programs, loading, error } = usePrograms()
  const [ids, setIds] = useState<number[]>(() => loadCompareIds())
  useEffect(() => { saveCompareIds(ids) }, [ids])
  const [search, setSearch] = useState('')
  const [listOpen, setListOpen] = useState(false)

  const toggle = (id: number) => {
    setIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  const remove = (id: number) => setIds(prev => prev.filter(x => x !== id))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const pool = programs.filter(p => !ids.includes(p.id))
    if (!q) return pool
    return pool.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q)
    )
  }, [programs, search, ids])

  const selected = programs.filter(p => ids.includes(p.id))
  const compare = selected

  const rows = useMemo(() => [
    { label: t('compare.minInvestment'), key: (p: Program) => `$${(p.finance.min_investment_usd ?? 0).toLocaleString()}` },
    { label: t('compare.typical'), key: (p: Program) => `$${(p.finance.typical_investment_usd ?? 0).toLocaleString()}` },
    { label: t('compare.govFees'), key: (p: Program) => `$${(p.finance.gov_fees_usd ?? 0).toLocaleString()}` },
    { label: t('compare.processing'), key: (p: Program) => `${p.finance.processing_time_months ?? '—'} ${t('compare.months')}` },
    { label: t('compare.btcScore'), key: (p: Program) => `${p.finance.crypto_friendly_score ?? '—'}/10` },
    { label: t('compare.sovereignty'), key: (p: Program) => `${p.sovereignty_score ?? '—'}/10` },
    { label: t('compare.risk'), key: (p: Program) => p.risk_level ?? '—' },
    { label: t('compare.lightning'), key: (p: Program) => p.lightning_ready ? t('compare.yes') : t('compare.no') },
  ], [t])

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow={t('compare.eyebrow')} title={t('compare.title')} subtitle={t('compare.subtitle')} />

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton count={4} />}
      {!loading && !error && (
        <>
          <div className="mb-8">
            <label className="text-xs font-medium text-ink-muted mb-2 block">
              {formatT(t, 'compare.programsLabel', { count: ids.length })}
            </label>
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {formatT(t, 'compare.programsLabel', { count: ids.length })}
            </p>
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {selected.map(p => (
                  <span key={p.id} className="chip-active inline-flex items-center gap-1.5 text-xs">
                    {p.flag} {p.name}
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="hover:text-status-red transition-colors"
                      aria-label={formatT(t, 'compare.remove', { name: p.name })}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setIds([])}
                  className="chip text-xs text-ink-muted hover:text-status-red"
                >
                  {t('common.cancel')} all
                </button>
              </div>
            )}
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => { setSearch(e.target.value); setListOpen(true) }}
                onFocus={() => setListOpen(true)}
                onBlur={() => setTimeout(() => setListOpen(false), 150)}
                placeholder={ids.length >= 4 ? t('compare.maxSelected') : t('compare.searchPlaceholder')}
                disabled={ids.length >= 4}
                className="input-field pl-9"
              />
              {listOpen && ids.length < 4 && filtered.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-mp-md border border-mp-border bg-mp-card shadow-mp-1">
                  {filtered.slice(0, 20).map(p => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { toggle(p.id); setSearch(''); setListOpen(false) }}
                        className="w-full text-left px-3 py-2.5 text-sm text-ink hover:bg-section transition-colors flex items-center gap-2"
                      >
                        <span>{p.flag}</span>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-ink-muted ml-auto">{p.region}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {listOpen && search && filtered.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-mp-md border border-mp-border bg-mp-card shadow-mp-1 px-3 py-3 text-sm text-ink-muted">
                  {t('compare.noMatch')}
                </div>
              )}
            </div>
          </div>

          {compare.length > 0 ? (
            <div className="overflow-x-auto rounded-card border border-mp-border bg-mp-card shadow-mp-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mp-border bg-mp-card-muted/60">
                    <th scope="col" className="p-3 text-left text-ink-muted text-xs uppercase">{t('compare.metric')}</th>
                    {compare.map(p => <th key={p.id} scope="col" className="p-3 text-left font-display text-ink">{p.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.label} className="border-b border-mp-border-subtle hover:bg-mp-btc-soft/20">
                      <th scope="row" className="p-3 text-left text-ink-muted font-medium">{r.label}</th>
                      {compare.map(p => <td key={p.id} className="p-3 font-mono text-xs text-ink">{r.key(p)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 rounded-card border border-mp-border bg-mp-card-muted text-mp-ink-tertiary">
              {t('compare.empty')}
            </div>
          )}
        </>
      )}
    </div>
  )
}