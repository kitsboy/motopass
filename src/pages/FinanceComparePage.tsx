import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadCompareIds, saveCompareIds } from '../lib/portfolioStorage'
import { Search, X } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { PageHeader } from '../components/ui/PageHeader'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import { parseIdList, serializeIdList } from '../lib/urlState'
import { toCinematicProgram } from '../lib/programAdapter'
import { ProgramModal } from '../components/programs/ProgramModal'
import type { Program as CinematicProgram } from '../components/programs/types'
import type { Program } from '../types/program'

function parseNumeric(val: string): number | null {
  const n = parseFloat(val.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

function bestIndex(values: string[], mode: 'min' | 'max'): Set<number> {
  const nums = values.map(parseNumeric)
  const valid = nums.filter((n): n is number => n !== null)
  if (!valid.length) return new Set()
  const target = mode === 'min' ? Math.min(...valid) : Math.max(...valid)
  const indices = new Set<number>()
  nums.forEach((n, i) => { if (n === target) indices.add(i) })
  return indices
}

export function FinanceComparePage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const { programs, loading, error } = usePrograms()
  const ids = useMemo(() => parseIdList(searchParams.get('ids')), [searchParams])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 150)
  const [listOpen, setListOpen] = useState(false)
  const [modalProgram, setModalProgram] = useState<CinematicProgram | null>(null)
  const listId = 'compare-program-list'

  useEffect(() => {
    saveCompareIds(ids)
  }, [ids])

  useEffect(() => {
    if (searchParams.get('ids')) return
    const saved = loadCompareIds()
    if (saved.length) {
      setSearchParams((p) => { p.set('ids', serializeIdList(saved)); return p }, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- hydrate once from localStorage

  const setIdsSynced = useCallback((next: number[]) => {
    saveCompareIds(next)
    setSearchParams((p) => {
      if (next.length) p.set('ids', serializeIdList(next))
      else p.delete('ids')
      return p
    }, { replace: true })
  }, [setSearchParams])

  const toggle = (id: number) => {
    setIdsSynced(
      ids.includes(id) ? ids.filter(x => x !== id) : ids.length >= 4 ? ids : [...ids, id],
    )
  }

  const remove = (id: number) => setIdsSynced(ids.filter(x => x !== id))

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const pool = programs.filter(p => !ids.includes(p.id))
    if (!q) return pool
    return pool.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q)
    )
  }, [programs, debouncedSearch, ids])

  const selected = programs.filter(p => ids.includes(p.id))
  const compare = selected

  const rows = useMemo(() => [
    { label: t('compare.minInvestment'), key: (p: Program) => `$${(p.finance.min_investment_usd ?? 0).toLocaleString()}`, best: 'min' as const },
    { label: t('compare.typical'), key: (p: Program) => `$${(p.finance.typical_investment_usd ?? 0).toLocaleString()}`, best: 'min' as const },
    { label: t('compare.govFees'), key: (p: Program) => `$${(p.finance.gov_fees_usd ?? 0).toLocaleString()}`, best: 'min' as const },
    { label: t('compare.processing'), key: (p: Program) => `${p.finance.processing_time_months ?? '—'} ${t('compare.months')}`, best: null },
    { label: t('compare.btcScore'), key: (p: Program) => `${p.finance.crypto_friendly_score ?? '—'}/10`, best: 'max' as const },
    { label: t('compare.sovereignty'), key: (p: Program) => `${p.sovereignty_score ?? '—'}/10`, best: 'max' as const },
    { label: t('compare.synergy'), key: (p: Program) => p.stacking_synergy ?? '—', best: null },
    { label: t('compare.btcIntegration'), key: (p: Program) => p.bitcoin_integration ?? '—', best: null },
    { label: t('compare.risk'), key: (p: Program) => p.risk_level ?? '—', best: null },
    { label: t('compare.lightning'), key: (p: Program) => p.lightning_ready ? t('compare.yes') : t('compare.no'), best: null },
  ], [t])

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow={t('compare.eyebrow')} title={t('compare.title')} subtitle={t('compare.subtitle')} />

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton count={4} />}
      {!loading && !error && (
        <>
          <div className="mb-8">
            <label htmlFor="compare-search" className="text-xs font-medium text-ink-muted mb-2 block">
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
                  onClick={() => setIdsSynced([])}
                  className="chip text-xs text-ink-muted hover:text-status-red"
                >
                  {t('compare.clearAll')}
                </button>
                {ids.length >= 2 && (
                  <Link
                    to={`/simulator?programs=${serializeIdList(ids)}`}
                    className="chip text-xs text-accent hover:underline"
                  >
                    {t('compare.openSimulator')}
                  </Link>
                )}
              </div>
            )}
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <input
                id="compare-search"
                type="search"
                role="combobox"
                aria-expanded={listOpen}
                aria-controls={listId}
                aria-autocomplete="list"
                value={search}
                onChange={e => { setSearch(e.target.value); setListOpen(true) }}
                onFocus={() => setListOpen(true)}
                onBlur={() => setTimeout(() => setListOpen(false), 150)}
                placeholder={ids.length >= 4 ? t('compare.maxSelected') : t('compare.searchPlaceholder')}
                disabled={ids.length >= 4}
                className="input-field pl-9"
              />
              {listOpen && ids.length < 4 && filtered.length > 0 && (
                <ul id={listId} role="listbox" className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-mp-md border border-mp-border bg-mp-card shadow-mp-1">
                  {filtered.slice(0, 20).map(p => (
                    <li key={p.id} role="option">
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
              {listOpen && debouncedSearch && filtered.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-mp-md border border-mp-border bg-mp-card shadow-mp-1 px-3 py-3 text-sm text-ink-muted">
                  {t('compare.noMatch')}
                </div>
              )}
            </div>
          </div>

          {compare.length > 0 ? (
            <>
              <div className="hidden md:block overflow-x-auto rounded-card border border-mp-border bg-mp-card shadow-mp-1">
                <table className="w-full text-sm">
                  <caption className="sr-only">{t('compare.title')}</caption>
                  <thead>
                    <tr className="border-b border-mp-border bg-mp-card-muted/60">
                      <th scope="col" className="p-3 text-left text-ink-muted text-xs uppercase">{t('compare.metric')}</th>
                      {compare.map(p => (
                        <th key={p.id} scope="col" className="p-3 text-left font-display text-ink">
                          <button
                            type="button"
                            onClick={() => setModalProgram(toCinematicProgram(p))}
                            className="hover:text-accent text-left transition-colors"
                            aria-label={formatT(t, 'compare.openProgram', { name: p.name })}
                          >
                            {p.name}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => {
                      const cells = compare.map(p => r.key(p))
                      const bests = r.best ? bestIndex(cells, r.best) : new Set<number>()
                      return (
                        <tr key={r.label} className="border-b border-mp-border-subtle hover:bg-mp-btc-soft/20">
                          <th scope="row" className="p-3 text-left text-ink-muted font-medium">{r.label}</th>
                          {compare.map((p, i) => (
                            <td key={p.id} className={`p-3 font-mono text-xs text-ink ${bests.has(i) ? 'compare-best-cell' : ''}`}>
                              {r.key(p)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden grid gap-3">
                {compare.map(p => (
                  <div key={p.id} className="rounded-card border border-mp-border bg-mp-card p-4">
                    <button
                      type="button"
                      onClick={() => setModalProgram(toCinematicProgram(p))}
                      className="font-display font-semibold text-ink mb-3 text-left hover:text-accent transition-colors"
                    >
                      {p.flag} {p.name}
                    </button>
                    <dl className="text-xs space-y-2">
                      {rows.map(r => (
                        <div key={r.label} className="flex justify-between gap-2 border-b border-mp/40 pb-1.5">
                          <dt className="text-ink-muted">{r.label}</dt>
                          <dd className="font-mono text-ink text-right">{r.key(p)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 rounded-card border border-mp-border bg-mp-card-muted text-mp-ink-tertiary">
              {t('compare.empty')}
            </div>
          )}
        </>
      )}

      <ProgramModal program={modalProgram} onClose={() => setModalProgram(null)} />
    </div>
  )
}