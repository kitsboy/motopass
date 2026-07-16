import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addPortfolioIds, loadCompareIds, saveCompareIds } from '../lib/portfolioStorage'
import { usePortfolio } from '../hooks/usePortfolio'
import { usePrograms } from '../hooks/usePrograms'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { useI18n } from '../i18n/I18nContext'
import { parseIdList, serializeIdList } from '../lib/urlState'
import { toCinematicProgram } from '../lib/programAdapter'
import { ProgramModal } from '../components/programs/ProgramModal'
import type { Program as CinematicProgram } from '../components/programs/types'
import type { Program } from '../types/program'
import { CompareMoneyCell } from '../components/CompareMoneyCell'
import { PageAnchorNav } from '../components/nav/PageAnchorNav'
import { rowValuesDiffer } from '../components/compare/compareUtils'
import type { CompareRow } from '../components/compare/types'
import { CompareHero } from '../components/compare/CompareHero'
import { ComparePicker } from '../components/compare/ComparePicker'
import { CompareSummaryStrip } from '../components/compare/CompareSummaryStrip'
import { CompareMatrix } from '../components/compare/CompareMatrix'
import { CompareDiffSection } from '../components/compare/CompareDiffSection'
import { CompareEmptyState } from '../components/compare/CompareEmptyState'
import { compareDiffMarkdown } from '../lib/compareMarkdown'
import { useToast } from '../components/ui/Toast'

export function FinanceComparePage() {
  const { t } = useI18n()
  const { toast } = useToast()
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
      setSearchParams(p => {
        p.set('ids', serializeIdList(saved))
        return p
      }, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setIdsSynced = useCallback(
    (next: number[]) => {
      saveCompareIds(next)
      setSearchParams(p => {
        if (next.length) p.set('ids', serializeIdList(next))
        else p.delete('ids')
        return p
      }, { replace: true })
    },
    [setSearchParams],
  )

  const toggle = (id: number) => {
    setIdsSynced(ids.includes(id) ? ids.filter(x => x !== id) : ids.length >= 4 ? ids : [...ids, id])
    setSearch('')
    setListOpen(false)
  }

  const remove = (id: number) => setIdsSynced(ids.filter(x => x !== id))

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const pool = programs.filter(p => !ids.includes(p.id))
    if (!q) return pool
    return pool.filter(
      p => p.name.toLowerCase().includes(q) || p.region.toLowerCase().includes(q),
    )
  }, [programs, debouncedSearch, ids])

  const compare = programs.filter(p => ids.includes(p.id))

  useEffect(() => {
    setStackAdded(false)
  }, [ids.join(',')])

  const rows = useMemo(
    (): CompareRow[] => [
      {
        label: t('compare.minInvestment'),
        group: 'finance',
        best: 'min',
        numeric: p => p.finance.min_investment_usd,
        valueKey: p => String(p.finance.min_investment_usd ?? ''),
        render: p => <CompareMoneyCell usd={p.finance.min_investment_usd ?? 0} />,
      },
      {
        label: t('compare.typical'),
        group: 'finance',
        best: 'min',
        numeric: p => p.finance.typical_investment_usd,
        valueKey: p => String(p.finance.typical_investment_usd ?? ''),
        render: p => <CompareMoneyCell usd={p.finance.typical_investment_usd ?? 0} />,
      },
      {
        label: t('compare.govFees'),
        group: 'finance',
        best: 'min',
        numeric: p => p.finance.gov_fees_usd,
        valueKey: p => String(p.finance.gov_fees_usd ?? ''),
        render: p => <CompareMoneyCell usd={p.finance.gov_fees_usd ?? 0} />,
      },
      {
        label: t('compare.processing'),
        group: 'timeline',
        best: null,
        numeric: () => null,
        valueKey: p => p.finance.processing_time_months ?? '',
        render: p => `${p.finance.processing_time_months ?? '—'} ${t('compare.months')}`,
      },
      {
        label: t('compare.btcScore'),
        group: 'scores',
        best: 'max',
        numeric: p => p.finance.crypto_friendly_score,
        valueKey: p => String(p.finance.crypto_friendly_score ?? ''),
        render: p => `${p.finance.crypto_friendly_score ?? '—'}/10`,
      },
      {
        label: t('compare.sovereignty'),
        group: 'scores',
        best: 'max',
        numeric: p => p.sovereignty_score ?? null,
        valueKey: p => String(p.sovereignty_score ?? ''),
        render: p => `${p.sovereignty_score ?? '—'}/10`,
      },
      {
        label: t('compare.synergy'),
        group: 'stack',
        best: null,
        numeric: () => null,
        valueKey: p => p.stacking_synergy ?? '',
        render: p => p.stacking_synergy ?? '—',
      },
      {
        label: t('compare.btcIntegration'),
        group: 'stack',
        best: null,
        numeric: () => null,
        valueKey: p => p.bitcoin_integration ?? '',
        render: p => p.bitcoin_integration ?? '—',
      },
      {
        label: t('compare.risk'),
        group: 'stack',
        best: null,
        numeric: () => null,
        valueKey: p => p.risk_level ?? '',
        render: p => p.risk_level ?? '—',
      },
      {
        label: t('compare.lightning'),
        group: 'stack',
        best: null,
        numeric: () => null,
        valueKey: p => (p.lightning_ready ? '1' : '0'),
        render: p => (p.lightning_ready ? t('compare.yes') : t('compare.no')),
      },
    ],
    [t],
  )

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

  const handleExportMarkdown = async () => {
    const mdRows = rows.map(r => ({
      label: r.label,
      valueKey: r.valueKey,
      render: (p: Program) => {
        const rendered = r.render(p)
        return typeof rendered === 'string' || typeof rendered === 'number' ? String(rendered) : r.valueKey(p)
      },
    }))
    const md = compareDiffMarkdown(compare, mdRows, rowValuesDiffer)
    if (!md) return
    try {
      await navigator.clipboard.writeText(md)
      toast(t('compare.exportMarkdownCopied'), 'success')
    } catch {
      toast(t('compare.exportMarkdownCopied'), 'error')
    }
  }

  return (
    <div className="fc-page compare-page">
      <div className="fc-page__ambient" aria-hidden />
      <div className="fc-page__grid" aria-hidden />

      <div className="fc-page__inner page-container px-4 sm:px-6 py-8 sm:py-12 max-w-7xl mx-auto min-w-0">
        <CompareHero slotCount={ids.length} />

        <PageAnchorNav items={compareAnchors} />

        {error && <ProgramsLoadError message={error} />}

        <ComparePicker
          ids={ids}
          selected={compare}
          filtered={filtered}
          search={search}
          listOpen={listOpen}
          listId={listId}
          debouncedSearch={debouncedSearch}
          programsLoading={loading}
          allInStack={allInStack}
          stackAdded={stackAdded}
          onSearchChange={v => {
            setSearch(v)
            setListOpen(true)
          }}
          onSearchFocus={() => setListOpen(true)}
          onSearchBlur={() => setTimeout(() => setListOpen(false), 150)}
          onToggle={toggle}
          onRemove={remove}
          onClearAll={() => setIdsSynced([])}
          onAddAllToStack={handleAddAllToStack}
        />

        {compare.length > 0 ? (
          loading ? (
            <CardSkeleton count={2} />
          ) : (
            <>
              <CompareSummaryStrip programs={compare} rows={rows} />
              <CompareMatrix
                programs={compare}
                rows={rows}
                onOpenProgram={setModalProgram}
                toCinematic={toCinematicProgram}
              />
              <CompareDiffSection programs={compare} diffRows={diffRows} onExport={handleExportMarkdown} />
            </>
          )
        ) : (
          <CompareEmptyState
            showSuggested={!loading && !!suggestedPair}
            onSuggestedPair={applySuggestedPair}
          />
        )}

        <ProgramModal program={modalProgram} onClose={() => setModalProgram(null)} />
      </div>
    </div>
  )
}