import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addPortfolioIds, loadCompareIds, saveCompareIds } from '../lib/portfolioStorage'
import { usePortfolio } from '../hooks/usePortfolio'
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
import { CompareMoneyCell } from '../components/CompareMoneyCell'
import { PageAnchorNav } from '../components/nav/PageAnchorNav'
import { compareDiffClass, compareDiffKind } from '../lib/compareDiff'

function bestIndex(nums: (number | null)[], mode: 'min' | 'max'): Set<number> {
  const valid = nums.filter((n): n is number => n !== null)
  if (!valid.length) return new Set()
  const target = mode === 'min' ? Math.min(...valid) : Math.max(...valid)
  const indices = new Set<number>()
  nums.forEach((n, i) => { if (n === target) indices.add(i) })
  return indices
}

type CompareRow = {
  label: string
  best: 'min' | 'max' | null
  numeric: (p: Program) => number | null
  valueKey: (p: Program) => string
  render: (p: Program) => ReactNode
}

function rowValuesDiffer(row: CompareRow, programs: Program[]): boolean {
  if (programs.length < 2) return false
  const keys = programs.map(p => row.valueKey(p))
  return new Set(keys).size > 1
}

export function FinanceComparePage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const { programs, loading, error } = usePrograms()
  const { portfolio, setPortfolio } = usePortfolio()
  const [stackAdded, setStackAdded] = useState(false)
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

  useEffect(() => {
    setStackAdded(false)
  }, [ids.join(',')])

  const rows = useMemo((): CompareRow[] => [
    {
      label: t('compare.minInvestment'),
      best: 'min',
      numeric: (p) => p.finance.min_investment_usd,
      valueKey: (p) => String(p.finance.min_investment_usd ?? ''),
      render: (p) => <CompareMoneyCell usd={p.finance.min_investment_usd ?? 0} />,
    },
    {
      label: t('compare.typical'),
      best: 'min',
      numeric: (p) => p.finance.typical_investment_usd,
      valueKey: (p) => String(p.finance.typical_investment_usd ?? ''),
      render: (p) => <CompareMoneyCell usd={p.finance.typical_investment_usd ?? 0} />,
    },
    {
      label: t('compare.govFees'),
      best: 'min',
      numeric: (p) => p.finance.gov_fees_usd,
      valueKey: (p) => String(p.finance.gov_fees_usd ?? ''),
      render: (p) => <CompareMoneyCell usd={p.finance.gov_fees_usd ?? 0} />,
    },
    {
      label: t('compare.processing'),
      best: null,
      numeric: () => null,
      valueKey: (p) => p.finance.processing_time_months ?? '',
      render: (p) => `${p.finance.processing_time_months ?? '—'} ${t('compare.months')}`,
    },
    {
      label: t('compare.btcScore'),
      best: 'max',
      numeric: (p) => p.finance.crypto_friendly_score,
      valueKey: (p) => String(p.finance.crypto_friendly_score ?? ''),
      render: (p) => `${p.finance.crypto_friendly_score ?? '—'}/10`,
    },
    {
      label: t('compare.sovereignty'),
      best: 'max',
      numeric: (p) => p.sovereignty_score ?? null,
      valueKey: (p) => String(p.sovereignty_score ?? ''),
      render: (p) => `${p.sovereignty_score ?? '—'}/10`,
    },
    {
      label: t('compare.synergy'),
      best: null,
      numeric: () => null,
      valueKey: (p) => p.stacking_synergy ?? '',
      render: (p) => p.stacking_synergy ?? '—',
    },
    {
      label: t('compare.btcIntegration'),
      best: null,
      numeric: () => null,
      valueKey: (p) => p.bitcoin_integration ?? '',
      render: (p) => p.bitcoin_integration ?? '—',
    },
    {
      label: t('compare.risk'),
      best: null,
      numeric: () => null,
      valueKey: (p) => p.risk_level ?? '',
      render: (p) => p.risk_level ?? '—',
    },
    {
      label: t('compare.lightning'),
      best: null,
      numeric: () => null,
      valueKey: (p) => (p.lightning_ready ? '1' : '0'),
      render: (p) => (p.lightning_ready ? t('compare.yes') : t('compare.no')),
    },
  ], [t])

  const diffRows = useMemo(
    () => (compare.length >= 2 && compare.length <= 3 ? rows.filter(r => rowValuesDiffer(r, compare)) : []),
    [rows, compare],
  )

  const allInStack = compare.length > 0 && compare.every(p => portfolio.includes(p.id))

  const compareAnchors = useMemo(
    () => [
      { id: 'compare-picker', label: t('subnav.compare.picker') },
      { id: 'compare-results', label: t('subnav.compare.results') },
      { id: 'compare-diff', label: t('subnav.compare.diff') },
    ],
    [t],
  )

  const handleAddAllToStack = () => {
    const next = addPortfolioIds(compare.map(p => p.id))
    setPortfolio(next)
    setStackAdded(true)
  }

  const suggestedPair = useMemo(() => {
    const uy = programs.find(p => p.name === 'Uruguay')
    const bo = programs.find(p => p.name === 'Bolivia')
    if (!uy || !bo) return null
    return [uy, bo] as const
  }, [programs])

  const applySuggestedPair = () => {
    if (!suggestedPair) return
    setIdsSynced([suggestedPair[0].id, suggestedPair[1].id])
  }

  return (
    <div className="compare-page page-container px-4 sm:px-6 py-8 max-w-7xl mx-auto min-w-0">
      <PageHeader eyebrow={t('compare.eyebrow')} title={t('compare.title')} subtitle={t('compare.subtitle')} />

      <PageAnchorNav items={compareAnchors} />

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton count={4} />}
      {!loading && !error && (
        <>
          <div id="compare-picker" className="mb-8 scroll-mt-header">
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
                <button
                  type="button"
                  onClick={handleAddAllToStack}
                  disabled={allInStack}
                  className={`chip text-xs ${allInStack ? 'text-ink-muted' : 'text-accent hover:underline'}`}
                >
                  {allInStack ? t('compare.addedToStack') : t('compare.addAllToStack')}
                </button>
                {stackAdded && !allInStack && (
                  <span className="sr-only" aria-live="polite">{t('compare.addedToStack')}</span>
                )}
              </div>
            )}
            <div className="relative max-w-md">
              <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
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
                className="input-field ps-9"
              />
              {listOpen && ids.length < 4 && filtered.length > 0 && (
                <ul id={listId} role="listbox" className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-mp-md border border-mp-border bg-mp-card shadow-mp-1">
                  {filtered.slice(0, 20).map(p => (
                    <li key={p.id} role="option">
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { toggle(p.id); setSearch(''); setListOpen(false) }}
                        className="w-full text-start px-3 py-2.5 text-sm text-ink hover:bg-section transition-colors flex items-center gap-2"
                      >
                        <span>{p.flag}</span>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-ink-muted ms-auto">{p.region}</span>
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
            <div id="compare-results" className="scroll-mt-header">
              <div className="hidden md:block min-w-0 overflow-x-auto rounded-card border border-mp-border bg-mp-card shadow-mp-1">
                <table className="w-full text-sm mp-table-zebra">
                  <caption className="sr-only">{t('compare.title')}</caption>
                  <thead>
                    <tr className="border-b border-mp-border bg-mp-card-muted/60">
                      <th scope="col" className="p-3 text-start text-ink-muted text-xs uppercase">{t('compare.metric')}</th>
                      {compare.map(p => (
                        <th key={p.id} scope="col" className="p-3 text-start font-display text-ink">
                          <button
                            type="button"
                            onClick={() => setModalProgram(toCinematicProgram(p))}
                            className="hover:text-accent text-start transition-colors"
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
                      const nums = compare.map(p => r.numeric(p))
                      const bests = r.best ? bestIndex(nums, r.best) : new Set<number>()
                      return (
                        <tr key={r.label} className="border-b border-mp-border-subtle hover:bg-mp-btc-soft/20">
                          <th scope="row" className="p-3 text-start text-ink-muted font-medium">{r.label}</th>
                          {compare.map((p, i) => (
                            <td key={p.id} className={`p-3 text-xs text-ink ${bests.has(i) ? 'compare-best-cell' : ''}`}>
                              {r.render(p)}
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
                      className="font-display font-semibold text-ink mb-3 text-start hover:text-accent transition-colors"
                    >
                      {p.flag} {p.name}
                    </button>
                    <dl className="text-xs space-y-2">
                      {rows.map(r => (
                        <div key={r.label} className="flex justify-between gap-2 border-b border-mp/40 pb-1.5">
                          <dt className="text-ink-muted">{r.label}</dt>
                          <dd className="text-ink text-end">{r.render(p)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
              {compare.length >= 2 && compare.length <= 3 && (
                <section id="compare-diff" className="mt-6 rounded-card border border-mp-border bg-mp-card-muted/50 p-4 scroll-mt-header" aria-labelledby="compare-diff-heading">
                  <h2 id="compare-diff-heading" className="font-display text-sm font-semibold text-ink">
                    {t('compare.diffTitle')}
                  </h2>
                  <p className="mt-1 text-xs text-ink-muted">{t('compare.diffSubtitle')}</p>
                  {diffRows.length === 0 ? (
                    <p className="mt-3 text-xs text-ink-muted">{t('compare.diffEmpty')}</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs mp-table-zebra">
                        <caption className="sr-only">{t('compare.diffTitle')}</caption>
                        <thead>
                          <tr className="border-b border-mp-border">
                            <th scope="col" className="p-2 text-start text-ink-muted font-medium">{t('compare.metric')}</th>
                            {compare.map(p => (
                              <th key={p.id} scope="col" className="p-2 text-start font-display text-ink">{p.flag} {p.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {diffRows.map(r => {
                            const nums = compare.map(p => r.numeric(p))
                            const bests = r.best ? bestIndex(nums, r.best) : new Set<number>()
                            const baselineKey = r.valueKey(compare[0])
                            return (
                              <tr key={r.label} className="border-b border-mp-border-subtle">
                                <th scope="row" className="p-2 text-start text-ink-muted font-medium whitespace-nowrap">{r.label}</th>
                                {compare.map((p, i) => {
                                  const valueKey = r.valueKey(p)
                                  const differs = valueKey !== baselineKey
                                  const kind = compareDiffKind(valueKey, baselineKey, bests.has(i), differs)
                                  const diffClass = compareDiffClass(kind)
                                  return (
                                    <td
                                      key={p.id}
                                      className={`p-2 text-ink ${diffClass} ${bests.has(i) ? 'compare-best-cell font-medium' : ''}`.trim()}
                                    >
                                      {r.render(p)}
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </div>
          ) : (
            <div id="compare-results" className="text-center py-16 rounded-card border border-mp-border bg-mp-card-muted text-mp-ink-tertiary scroll-mt-header">
              <p>{t('compare.empty')}</p>
              {suggestedPair && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <p className="text-sm text-ink-muted">{t('compare.suggestPairs')}</p>
                  <button
                    type="button"
                    onClick={applySuggestedPair}
                    className="chip text-xs hover:border-mp-btc/40"
                  >
                    {t('compare.suggestUruguayBolivia')}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ProgramModal program={modalProgram} onClose={() => setModalProgram(null)} />
    </div>
  )
}