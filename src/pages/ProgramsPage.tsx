import { useEffect, useState, useMemo } from 'react'
import { LayoutGrid, Table, Download, Upload, Plus } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { filterPrograms, DEFAULT_FILTERS, type ProgramFilters } from '../lib/programFilter'
import { loadPortfolio, togglePortfolio, loadSavedFilters, saveSavedFilters, exportProgramsJson, importProgramsJson } from '../lib/portfolioStorage'
import { ProgramCard } from '../components/ProgramCard'
import { ProgramsTable } from '../components/ProgramsTable'
import { ProgramModal, type ProgramModalTab } from '../components/ProgramModal'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { PageHeader } from '../components/ui/PageHeader'
import type { Program } from '../types/program'

const iconBtn = (active: boolean) =>
  `p-2.5 rounded-mp-md border transition-colors ${active ? 'chip-active !px-2.5' : 'chip hover:border-mp-strong'}`

export function ProgramsPage() {
  const { programs: basePrograms, loading } = usePrograms()
  const [addedPrograms, setAddedPrograms] = useState<Program[]>([])
  const programs = useMemo(() => [...basePrograms, ...addedPrograms], [basePrograms, addedPrograms])
  const [filters, setFilters] = useState<ProgramFilters>(() => loadSavedFilters<ProgramFilters>() ?? DEFAULT_FILTERS)
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [portfolio, setPortfolio] = useState<number[]>(loadPortfolio)
  const [selected, setSelected] = useState<Program | null>(null)
  const [tab, setTab] = useState<ProgramModalTab>('Overview')

  useEffect(() => { saveSavedFilters(filters) }, [filters])

  const filtered = useMemo(() => filterPrograms(programs, filters), [programs, filters])
  const regions = ['All', ...Array.from(new Set(programs.map(p => p.region)))]
  const categories = ['All', ...Array.from(new Set(programs.map(p => p.category)))]

  const handleToggle = (id: number) => setPortfolio(togglePortfolio(id))

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
    setAddedPrograms(p => [...p, {
      id: Date.now(), name, category: 'rbi_cbi', region: 'TBD', status: 'Researching',
      bitcoin_integration: 'User added', details: 'Added via explorer', last_checked: new Date().toISOString().slice(0, 10),
      finance: { min_investment_usd: null, typical_investment_usd: null, gov_fees_usd: null, processing_time_months: null, tax_benefits: '', crypto_friendly_score: null, bitcoin_specific: '' },
      sovereignty_score: 5, stacking_synergy: 'low', risk_level: 'medium', lightning_ready: false,
    }])
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="ALL PROGRAMS"
        title="Program explorer"
        subtitle={`${filtered.length} of ${programs.length} programs · card or table view`}
        actions={
          <>
            <button type="button" onClick={() => setView('cards')} className={iconBtn(view === 'cards')} aria-label="Card view"><LayoutGrid size={16} /></button>
            <button type="button" onClick={() => setView('table')} className={iconBtn(view === 'table')} aria-label="Table view"><Table size={16} /></button>
            <button type="button" onClick={handleExport} className={iconBtn(false)} title="Export"><Download size={16} /></button>
            <button type="button" onClick={handleImport} className={iconBtn(false)} title="Import"><Upload size={16} /></button>
            <button type="button" onClick={addNew} className={iconBtn(false)} title="Add new"><Plus size={16} /></button>
          </>
        }
      />

      <div className="card-muted mb-8 space-y-4">
        <input
          type="search"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search programs…"
          className="input-field"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))} className="select-field">
            {regions.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="select-field">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink-secondary sm:col-span-2">
            <input type="checkbox" checked={filters.lightningOnly} onChange={e => setFilters(f => ({ ...f, lightningOnly: e.target.checked }))} className="accent-btc-orange w-4 h-4" />
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
              onChange={e => setFilters(f => ({ ...f, [key]: Number(e.target.value) }))}
              className="w-full accent-btc-orange h-2"
            />
          </div>
        ))}
      </div>

      {loading && <CardSkeleton />}
      {!loading && view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map(p => <ProgramCard key={p.id} program={p} onClick={() => { setSelected(p); setTab('Overview') }} />)}
        </div>
      )}
      {!loading && view === 'table' && (
        <ProgramsTable programs={filtered} portfolio={portfolio} onSelect={p => { setSelected(p); setTab('Overview') }} onToggleAcquired={handleToggle} />
      )}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 card-muted">
          <p className="text-ink-muted">No programs match your filters.</p>
        </div>
      )}

      {selected && <ProgramModal program={selected} tab={tab} onTab={setTab} onClose={() => setSelected(null)} />}
    </div>
  )
}