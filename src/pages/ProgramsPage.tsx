import { useEffect, useMemo, useState } from 'react'
import { Download, Upload, Plus, Table, LayoutGrid } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { filterPrograms, DEFAULT_FILTERS, type ProgramFilters } from '../lib/programFilter'
import {
  loadPortfolio,
  togglePortfolio,
  loadSavedFilters,
  saveSavedFilters,
  exportProgramsJson,
  importProgramsJson,
} from '../lib/portfolioStorage'
import { toCinematicPrograms, cinematicIdToNumber } from '../lib/programAdapter'
import { PageHeader } from '../components/ui/PageHeader'
import { Chip } from '../components/ui/Chip'
import { ProgramCard } from '../components/programs/ProgramCard'
import { ProgramsTable } from '../components/programs/ProgramsTable'
import { ProgramModal } from '../components/programs/ProgramModal'
import { CardSkeleton } from '../components/LoadingSkeleton'
import type { Program as CinematicProgram } from '../components/programs/types'
import type { Program } from '../types/program'

const iconBtn = (active: boolean) =>
  `rounded-chip border px-2.5 py-2 font-chrome text-xs transition-colors duration-fast ${
    active ? 'border-mp-btc/40 bg-mp-btc-soft text-mp-btc-text shadow-mp-1' : 'border-mp-border text-mp-ink-secondary hover:border-mp-border-strong hover:text-mp-ink'
  }`

export function ProgramsPage() {
  const { programs: basePrograms, loading } = usePrograms()
  const [addedPrograms, setAddedPrograms] = useState<Program[]>([])
  const programs = useMemo(() => [...basePrograms, ...addedPrograms], [basePrograms, addedPrograms])
  const [filters, setFilters] = useState<ProgramFilters>(() => loadSavedFilters<ProgramFilters>() ?? DEFAULT_FILTERS)
  const [view, setView] = useState<'table' | 'card'>('table')
  const [portfolio, setPortfolio] = useState<number[]>(loadPortfolio)
  const [active, setActive] = useState<CinematicProgram | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => { saveSavedFilters(filters) }, [filters])

  const filtered = useMemo(() => filterPrograms(programs, filters), [programs, filters])
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

  const handleExport = () => {
    const blob = new Blob([exportProgramsJson(programs)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'motopass-programs.json'
    a.click()
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setAddedPrograms(importProgramsJson(await file.text()))
    }
    input.click()
  }

  const addNew = () => {
    const name = prompt('New program name?')
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
  }

  const handleAddToStack = (program: CinematicProgram) => {
    const id = cinematicIdToNumber(program.id)
    setPortfolio(togglePortfolio(id))
    setActive(null)
  }

  return (
    <div className="min-h-screen bg-mp-canvas">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-16">
        <PageHeader
          eyebrow={`${programs.length} jurisdictions, tracked`}
          title="Programs"
          description="Every figure below is modeled, timestamped, and re-checked on a schedule — not a one-time brochure snapshot."
          actions={
            <>
              <div className="hidden items-center gap-1 rounded-chip bg-mp-section p-1 sm:flex">
                <button type="button" onClick={() => setView('table')} className={iconBtn(view === 'table')} aria-label="Table view">
                  <Table size={14} />
                </button>
                <button type="button" onClick={() => setView('card')} className={iconBtn(view === 'card')} aria-label="Card view">
                  <LayoutGrid size={14} />
                </button>
              </div>
              <button type="button" onClick={handleExport} className={iconBtn(false)} title="Export" aria-label="Export">
                <Download size={14} />
              </button>
              <button type="button" onClick={handleImport} className={iconBtn(false)} title="Import" aria-label="Import">
                <Upload size={14} />
              </button>
              <button type="button" onClick={addNew} className={iconBtn(false)} title="Add new" aria-label="Add new">
                <Plus size={14} />
              </button>
            </>
          }
        />

        <div className="mb-6">
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search programs…"
            className="input-field mb-3"
          />
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="font-chrome text-xs text-mp-ink-tertiary hover:text-mp-ink"
          >
            {showAdvanced ? 'Hide' : 'Show'} advanced filters
          </button>
          {showAdvanced && (
            <div className="card-muted mt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
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
                    onChange={(e) => setFilters((f) => ({ ...f, lightningOnly: e.target.checked }))}
                    className="accent-btc-orange w-4 h-4"
                  />
                  Lightning ready only
                </label>
              </div>
              {[
                { label: 'Min investment', key: 'minInvestment' as const, max: 2000000, step: 25000 },
                { label: 'Max investment', key: 'maxInvestment' as const, max: 2000000, step: 50000 },
                { label: 'Min crypto score', key: 'minCryptoScore' as const, max: 10, step: 1 },
              ].map(({ label, key, max, step }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-ink-muted mb-1 block">
                    {label}: {key === 'minCryptoScore' ? filters[key] : `$${filters[key].toLocaleString()}`}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={max}
                    step={step}
                    value={filters[key]}
                    onChange={(e) => setFilters((f) => ({ ...f, [key]: Number(e.target.value) }))}
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
                Region
              </span>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-2 lg:mt-0 lg:flex-col lg:overflow-visible lg:pb-0">
                {regions.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    active={regionFilter === r}
                    onClick={() => setFilters((f) => ({ ...f, region: r }))}
                    count={regionCounts[r] ?? 0}
                  />
                ))}
              </div>
            </aside>

            <div>
              {cinematic.length === 0 && (
                <div className="text-center py-16 rounded-card border border-mp-border bg-mp-card">
                  <p className="text-mp-ink-tertiary">No programs match your filters.</p>
                </div>
              )}

              {cinematic.length > 0 && (
                <>
                  <div className="hidden sm:block">
                    {view === 'table' ? (
                      <ProgramsTable programs={cinematic} onSelect={setActive} />
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {cinematic.map((p, i) => (
                          <ProgramCard key={p.id} program={p} onSelect={setActive} index={i} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 sm:hidden">
                    {cinematic.map((p, i) => (
                      <ProgramCard key={p.id} program={p} onSelect={setActive} index={i} />
                    ))}
                  </div>
                </>
              )}

              {portfolio.length > 0 && (
                <p className="mt-6 font-mono text-[11px] text-mp-ink-tertiary">
                  {portfolio.length} program{portfolio.length === 1 ? '' : 's'} in your stack
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
      />
    </div>
  )
}