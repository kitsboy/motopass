import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Upload, Plus, Table, LayoutGrid, Link2, Rows3 } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { usePortfolio } from '../hooks/usePortfolio'
import { filterPrograms, DEFAULT_FILTERS, type ProgramFilters } from '../lib/programFilter'
import {
  loadSavedFilters,
  saveSavedFilters,
  exportProgramsJson,
  importProgramsJson,
  loadProgramsView,
  saveProgramsView,
  loadProgramsTableDensity,
  saveProgramsTableDensity,
  type ProgramsTableDensity,
  type ImportErrorCode,
} from '../lib/portfolioStorage'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { toCinematicPrograms, cinematicIdToNumber } from '../lib/programAdapter'
import { PageHeader } from '../components/ui/PageHeader'
import { GoldStandardSpotlight } from '../components/programs/GoldStandardSpotlight'
import { ProgramsComplianceStrip } from '../components/programs/ProgramsComplianceStrip'
import { Chip } from '../components/ui/Chip'
import { ClassyModal } from '../components/ui/ClassyModal'
import { ProgramCard } from '../components/programs/ProgramCard'
import { ProgramsTable } from '../components/programs/ProgramsTable'
import { ProgramModal } from '../components/programs/ProgramModal'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import type { Program as CinematicProgram } from '../components/programs/types'
import type { Program } from '../types/program'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import { SeoHead } from '../components/SeoHead'
import { absoluteUrl } from '../lib/seo'
import { countActiveFilters, filtersFromSearchParams, filtersToSearchParams, isDefaultFilters } from '../lib/urlState'
import {
  type FilterPresetId,
  isFilterPresetActive,
  toggleFilterPreset,
  activeFilterPresetsFromFilters,
  saveSessionFilterPresets,
  loadSessionFilterPresets,
  applyFilterPresets,
} from '../lib/programFilterPresets'

const FILTER_PRESETS: { id: FilterPresetId; labelKey: 'programs.presetUnder100k' | 'programs.presetLightning' | 'programs.presetBitcoinFriendly' }[] = [
  { id: 'under100k', labelKey: 'programs.presetUnder100k' },
  { id: 'lightning', labelKey: 'programs.presetLightning' },
  { id: 'bitcoinFriendly', labelKey: 'programs.presetBitcoinFriendly' },
]

const iconBtn = (active: boolean) =>
  `rounded-xl border px-2.5 py-2 font-chrome text-xs transition-all duration-fast ${
    active
      ? 'border-btc-orange/40 bg-btc-orange-soft text-mp-btc-text shadow-mp-glow scale-[1.02]'
      : 'border-mp-border text-mp-ink-secondary hover:border-btc-orange/30 hover:text-mp-ink hover:scale-[1.02]'
  }`

export function ProgramsPage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const { programs: basePrograms, loading, error } = usePrograms()
  const { portfolio, toggle: togglePortfolio } = usePortfolio()
  const [addedPrograms, setAddedPrograms] = useState<Program[]>([])
  const programs = useMemo(() => [...basePrograms, ...addedPrograms], [basePrograms, addedPrograms])
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams])
  const view = (searchParams.get('view') === 'card' ? 'card' : 'table') as 'table' | 'card'
  const [active, setActive] = useState<CinematicProgram | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [importErrorCode, setImportErrorCode] = useState<ImportErrorCode | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [tableDensity, setTableDensity] = useState<ProgramsTableDensity>(() => loadProgramsTableDensity())
  const advancedId = 'programs-advanced-filters'
  const activeFilterCount = countActiveFilters(filters)

  useEffect(() => { saveSavedFilters(filters) }, [filters])
  useEffect(() => { saveProgramsView(view) }, [view])
  useEffect(() => { saveProgramsTableDensity(tableDensity) }, [tableDensity])
  useEffect(() => {
    saveSessionFilterPresets(activeFilterPresetsFromFilters(filters))
  }, [filters])

  useEffect(() => {
    if (searchParams.toString()) return
    const saved = loadSavedFilters<ProgramFilters>()
    const savedView = loadProgramsView()
    const sessionPresets = loadSessionFilterPresets()
    const baseFilters = saved ?? DEFAULT_FILTERS
    const hydratedFilters = sessionPresets.length ? applyFilterPresets(baseFilters, sessionPresets) : baseFilters
    if (saved || savedView || sessionPresets.length) {
      setSearchParams(filtersToSearchParams(hydratedFilters, savedView ?? 'table'), { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- hydrate once

  const patchFilters = useCallback((patch: Partial<ProgramFilters>) => {
    const next = { ...filters, ...patch }
    setSearchParams(filtersToSearchParams(next, view), { replace: true })
  }, [filters, view, setSearchParams])

  const setViewMode = useCallback((v: 'table' | 'card') => {
    setSearchParams(filtersToSearchParams(filters, v), { replace: true })
  }, [filters, setSearchParams])

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const debouncedSearch = useDebouncedValue(filters.search, 150)
  const filtered = useMemo(
    () => filterPrograms(programs, { ...filters, search: debouncedSearch }),
    [programs, filters, debouncedSearch],
  )
  const cinematic = useMemo(() => toCinematicPrograms(filtered), [filtered])
  const regions = ['All', ...Array.from(new Set(programs.map((p) => p.region)))]
  const categories = ['All', ...Array.from(new Set(programs.map((p) => p.category)))]

  const regionFilter = filters.region === 'All' ? 'All' : filters.region
  const regionCounts = useMemo(() => {
    const base = filterPrograms(programs, { ...filters, region: 'All' })
    const counts: Record<string, number> = { All: base.length }
    for (const p of base) counts[p.region] = (counts[p.region] ?? 0) + 1
    return counts
  }, [programs, filters])

  const handleExportAll = () => {
    const blob = new Blob([exportProgramsJson(programs)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'motopass-programs.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportFiltered = () => {
    const filteredIds = filtered.map((p) => p.id)
    const blob = new Blob([
      exportProgramsJson(filtered, {
        filter_snapshot: filters,
        program_ids: filteredIds,
        count: filtered.length,
      }),
    ], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'motopass-programs-filtered.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyShareUrl = async () => {
    const params = filtersToSearchParams(filters, view)
    const url = `${window.location.origin}/programs?${params.toString()}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2000)
    } catch {
      setShareCopied(false)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      if (!window.confirm(t('programs.importConfirm'))) return
      const result = importProgramsJson(await file.text())
      if (result.errorCode) {
        setImportErrorCode(result.errorCode)
        return
      }
      setImportErrorCode(null)
      setAddedPrograms(result.programs)
    }
    input.click()
  }

  const submitNewProgram = () => {
    const name = newName.trim()
    if (!name) return
    setAddedPrograms((p) => [
      ...p,
      {
        id: Date.now(),
        name,
        category: 'rbi_cbi',
        region: 'TBD',
        status: 'Researching',
        bitcoin_integration: 'User added',
        details: 'Added via explorer',
        last_checked: new Date().toISOString().slice(0, 10),
        finance: {
          min_investment_usd: null,
          typical_investment_usd: null,
          gov_fees_usd: null,
          processing_time_months: null,
          tax_benefits: '',
          crypto_friendly_score: null,
          bitcoin_specific: '',
        },
        sovereignty_score: 5,
        stacking_synergy: 'low',
        risk_level: 'medium',
        lightning_ready: false,
      },
    ])
    setNewName('')
    setAddOpen(false)
  }

  const handleTogglePortfolio = (program: CinematicProgram) => {
    togglePortfolio(cinematicIdToNumber(program.id))
  }

  const handleAddToStack = (program: CinematicProgram) => {
    handleTogglePortfolio(program)
    setActive(null)
  }

  const isInPortfolio = (program: CinematicProgram) =>
    portfolio.includes(cinematicIdToNumber(program.id))

  const programsJsonLd = useMemo(() => {
    const items = programs.slice(0, 50)
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Sovereign Passport & Residency Programs',
      numberOfItems: items.length,
      itemListElement: items.map((program, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: program.name,
        url: `${absoluteUrl('/programs')}#program-${program.id}`,
      })),
    }
  }, [programs])

  return (
    <div className="page-container">
      <SeoHead jsonLd={programsJsonLd} jsonLdOnly />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-14">
        <PageHeader
          eyebrow={formatT(t, 'programs.eyebrow', { count: programs.length })}
          title={t('programs.title')}
          description={t('programs.description')}
          actions={
            <>
              <div className="hidden items-center gap-1 rounded-chip bg-mp-section p-1 sm:flex">
                <button type="button" onClick={() => setViewMode('table')} className={iconBtn(view === 'table')} aria-label={t('programs.tableView')}>
                  <Table size={14} />
                </button>
                <button type="button" onClick={() => setViewMode('card')} className={iconBtn(view === 'card')} aria-label={t('programs.cardView')}>
                  <LayoutGrid size={14} />
                </button>
              </div>
              {view === 'table' && (
                <button
                  type="button"
                  onClick={() => setTableDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}
                  className={iconBtn(tableDensity === 'compact')}
                  title={tableDensity === 'compact' ? t('programs.tableComfortable') : t('programs.tableCompact')}
                  aria-label={tableDensity === 'compact' ? t('programs.tableComfortable') : t('programs.tableCompact')}
                  aria-pressed={tableDensity === 'compact'}
                >
                  <Rows3 size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className={iconBtn(shareCopied)}
                title={shareCopied ? t('programs.shareCopied') : t('programs.shareUrl')}
                aria-label={shareCopied ? t('programs.shareCopied') : t('programs.shareUrl')}
              >
                <Link2 size={14} />
              </button>
              <button
                type="button"
                onClick={handleExportFiltered}
                className={iconBtn(false)}
                title={t('programs.exportFiltered')}
                aria-label={t('programs.exportFiltered')}
              >
                <Download size={14} />
              </button>
              <button type="button" onClick={handleExportAll} className={iconBtn(false)} title={t('programs.export')} aria-label={t('programs.export')}>
                <Download size={14} />
              </button>
              <button type="button" onClick={handleImport} className={iconBtn(false)} title={t('programs.import')} aria-label={t('programs.import')}>
                <Upload size={14} />
              </button>
              <button type="button" onClick={() => setAddOpen(true)} className={iconBtn(false)} title={t('programs.addProgram')} aria-label={t('programs.addProgram')}>
                <Plus size={14} />
              </button>
            </>
          }
        />

        {!loading && !error && programs.length > 0 && (
          <>
            <GoldStandardSpotlight programs={programs} />
            <ProgramsComplianceStrip />
          </>
        )}

        {error && <ProgramsLoadError message={error} />}
        {importErrorCode && (
          <p className="mb-4 text-sm text-status-red field-error-shake" role="alert">
            {t('programs.importError')}: {t(`programs.importError.${importErrorCode}` as 'programs.importError.INVALID_JSON')}
            <span className="ml-2 font-mono text-[11px] text-mp-ink-muted">[{importErrorCode}]</span>
          </p>
        )}

        <div className="mb-6">
          <input
            type="search"
            value={filters.search}
            onChange={(e) => patchFilters({ search: e.target.value })}
            placeholder={t('programs.search')}
            className="input-field mb-3"
          />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary">
              {t('programs.filterPresets')}
            </span>
            {FILTER_PRESETS.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                aria-pressed={isFilterPresetActive(id, filters)}
                onClick={() => patchFilters(toggleFilterPreset(id, filters))}
                className={isFilterPresetActive(id, filters) ? 'chip-active text-xs' : 'chip text-xs'}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              aria-expanded={showAdvanced}
              aria-controls={advancedId}
              className="font-chrome text-xs text-mp-ink-tertiary hover:text-mp-ink inline-flex items-center gap-1.5"
            >
              {showAdvanced ? t('programs.hideAdvanced') : t('programs.showAdvanced')}
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-btc-orange-soft px-1.5 py-0.5 text-[10px] font-semibold text-mp-btc-text">
                  {formatT(t, 'programs.filtersActive', { count: activeFilterCount })}
                </span>
              )}
            </button>
            {!isDefaultFilters(filters) && (
              <button type="button" onClick={clearFilters} className="font-chrome text-xs text-accent hover:underline">
                {t('programs.clearFilters')}
              </button>
            )}
          </div>
          {showAdvanced && (
            <div id={advancedId} className="card-muted mt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  value={filters.category}
                  onChange={(e) => patchFilters({ category: e.target.value })}
                  className="select-field"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-ink-secondary sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={filters.lightningOnly}
                    onChange={(e) => patchFilters({ lightningOnly: e.target.checked })}
                    className="accent-btc-orange w-4 h-4"
                  />
                  {t('programs.lightningOnly')}
                </label>
              </div>
              {[
                { labelKey: 'programs.minInvestment' as const, key: 'minInvestment' as const, max: 2000000, step: 25000 },
                { labelKey: 'programs.maxInvestment' as const, key: 'maxInvestment' as const, max: 2000000, step: 50000 },
                { labelKey: 'programs.minCryptoScore' as const, key: 'minCryptoScore' as const, max: 10, step: 1 },
              ].map(({ labelKey, key, max, step }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-ink-muted mb-1 block">
                    {t(labelKey)}: {key === 'minCryptoScore' ? filters[key] : `$${filters[key].toLocaleString()}`}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={max}
                    step={step}
                    value={filters[key]}
                    onChange={(e) => patchFilters({ [key]: Number(e.target.value) } as Partial<ProgramFilters>)}
                    className="w-full accent-btc-orange h-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {loading && <CardSkeleton />}

        {!loading && (
          <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <span className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary lg:block lg:mb-3">
                {t('programs.region')}
              </span>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-2 lg:mt-0 lg:flex-col lg:overflow-visible lg:pb-0">
                {regions.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    active={regionFilter === r}
                    onClick={() => patchFilters({ region: r })}
                    count={regionCounts[r] ?? 0}
                  />
                ))}
              </div>
            </aside>

            <div>
              <p className="sr-only" aria-live="polite" aria-atomic="true">
                {formatT(t, 'programs.filterResults', { count: cinematic.length })}
              </p>
              {cinematic.length === 0 && (
                <div className="text-center py-16 rounded-2xl border border-mp-border glass-card">
                  <p className="text-mp-ink-tertiary mb-2">{t('programs.noMatch')}</p>
                  <p className="text-sm text-mp-ink-muted mb-6">{t('programs.emptySuggest')}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {FILTER_PRESETS.map(({ id, labelKey }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => patchFilters(toggleFilterPreset(id, DEFAULT_FILTERS))}
                        className="chip text-xs hover:border-mp-btc/40"
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                    {!isDefaultFilters(filters) && (
                      <button type="button" onClick={clearFilters} className="chip text-xs text-accent hover:underline">
                        {t('programs.clearFilters')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {cinematic.length > 0 && (
                <>
                  {view === 'table' && (
                    <div className="hidden sm:block">
                      <ProgramsTable
                        programs={cinematic}
                        onSelect={setActive}
                        portfolioIds={portfolio}
                        onTogglePortfolio={handleTogglePortfolio}
                        density={tableDensity}
                      />
                    </div>
                  )}
                  <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${view === 'table' ? 'sm:hidden' : ''}`}>
                    {cinematic.map((p, i) => (
                      <ProgramCard
                        key={p.id}
                        program={p}
                        onSelect={setActive}
                        index={i}
                        inPortfolio={isInPortfolio(p)}
                        onTogglePortfolio={handleTogglePortfolio}
                      />
                    ))}
                  </div>
                </>
              )}

              {portfolio.length > 0 && (
                <p className="mt-6 font-mono text-[11px] text-mp-ink-tertiary">
                  {portfolio.length} {t('programs.inStack')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <ProgramModal
        program={active}
        onClose={() => setActive(null)}
        onAddToStack={handleAddToStack}
        inPortfolio={active ? isInPortfolio(active) : false}
      />

      <ClassyModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setNewName('') }}
        title={t('programs.addProgramTitle')}
        subtitle={t('programs.addProgramSubtitle')}
        maxWidth="md"
      >
        <div className="space-y-4">
          <label htmlFor="add-program-name" className="block text-sm font-medium text-ink-secondary">{t('programs.addProgramName')}</label>
          <input
            id="add-program-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('programs.addProgramPlaceholder')}
            className="input-field"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') submitNewProgram() }}
          />
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => { setAddOpen(false); setNewName('') }} className="btn-secondary text-sm">
              {t('common.cancel')}
            </button>
            <button type="button" onClick={submitNewProgram} disabled={!newName.trim()} className="btn-primary text-sm">
              {t('programs.addProgramSubmit')}
            </button>
          </div>
        </div>
      </ClassyModal>
    </div>
  )
}