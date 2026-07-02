import { useEffect, useState, useMemo } from 'react'
import { LayoutGrid, Table, Download, Upload, Plus } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { filterPrograms, DEFAULT_FILTERS, type ProgramFilters } from '../lib/programFilter'
import { loadPortfolio, togglePortfolio, loadSavedFilters, saveSavedFilters, exportProgramsJson, importProgramsJson } from '../lib/portfolioStorage'
import { ProgramCard } from '../components/ProgramCard'
import { ProgramsTable } from '../components/ProgramsTable'
import { ProgramModal, type ProgramModalTab } from '../components/ProgramModal'
import { CardSkeleton } from '../components/LoadingSkeleton'
import type { Program } from '../types/program'

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
      const text = await file.text()
      setAddedPrograms(importProgramsJson(text))
    }
    input.click()
  }

  const addNew = () => {
    const name = prompt('New program name?')
    if (!name) return
    const newP: Program = {
      id: Date.now(), name, category: 'rbi_cbi', region: 'TBD', status: 'Researching',
      bitcoin_integration: 'User added', details: 'Added via explorer', last_checked: new Date().toISOString().slice(0, 10),
      finance: { min_investment_usd: null, typical_investment_usd: null, gov_fees_usd: null, processing_time_months: null, tax_benefits: '', crypto_friendly_score: null, bitcoin_specific: '' },
      sovereignty_score: 5, stacking_synergy: 'low', risk_level: 'medium', lightning_ready: false,
    }
    setAddedPrograms(p => [...p, newP])
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <div className="section-label mb-1">ALL PROGRAMS</div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold">Program explorer</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setView('cards')} className={`p-2 rounded-lg border ${view === 'cards' ? 'border-btc-orange text-btc-orange' : 'border-white/15'}`}><LayoutGrid size={16} /></button>
          <button type="button" onClick={() => setView('table')} className={`p-2 rounded-lg border ${view === 'table' ? 'border-btc-orange text-btc-orange' : 'border-white/15'}`}><Table size={16} /></button>
          <button type="button" onClick={handleExport} className="p-2 rounded-lg border border-white/15" title="Export"><Download size={16} /></button>
          <button type="button" onClick={handleImport} className="p-2 rounded-lg border border-white/15" title="Import"><Upload size={16} /></button>
          <button type="button" onClick={addNew} className="p-2 rounded-lg border border-white/15" title="Add new"><Plus size={16} /></button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <input type="search" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search…" className="bg-sovereign-void border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-btc-orange/50" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))} className="bg-sovereign-void border border-white/10 rounded-xl px-3 py-2 text-sm">
            {regions.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="bg-sovereign-void border border-white/10 rounded-xl px-3 py-2 text-sm">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-sovereign-silver col-span-2 sm:col-span-1">
            <input type="checkbox" checked={filters.lightningOnly} onChange={e => setFilters(f => ({ ...f, lightningOnly: e.target.checked }))} className="accent-btc-orange" />
            Lightning ready
          </label>
        </div>
        <div>
          <label className="text-xs text-sovereign-silver">Min investment: ${filters.minInvestment.toLocaleString()}</label>
          <input type="range" min={0} max={2000000} step={25000} value={filters.minInvestment}
            onChange={e => setFilters(f => ({ ...f, minInvestment: Number(e.target.value) }))} className="w-full accent-btc-orange" />
        </div>
        <div>
          <label className="text-xs text-sovereign-silver">Max investment: ${filters.maxInvestment.toLocaleString()}</label>
          <input type="range" min={0} max={2000000} step={50000} value={filters.maxInvestment}
            onChange={e => setFilters(f => ({ ...f, maxInvestment: Number(e.target.value) }))} className="w-full accent-btc-orange" />
        </div>
        <div>
          <label className="text-xs text-sovereign-silver">Min crypto score: {filters.minCryptoScore}</label>
          <input type="range" min={0} max={10} value={filters.minCryptoScore}
            onChange={e => setFilters(f => ({ ...f, minCryptoScore: Number(e.target.value) }))} className="w-full accent-btc-orange" />
        </div>
      </div>

      {loading && <CardSkeleton />}
      {!loading && view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => <ProgramCard key={p.id} program={p} onClick={() => { setSelected(p); setTab('Overview') }} />)}
        </div>
      )}
      {!loading && view === 'table' && (
        <ProgramsTable programs={filtered} portfolio={portfolio} onSelect={p => { setSelected(p); setTab('Overview') }} onToggleAcquired={handleToggle} />
      )}
      {!loading && filtered.length === 0 && <p className="text-center text-sovereign-silver py-12">No matches</p>}

      {selected && <ProgramModal program={selected} tab={tab} onTab={setTab} onClose={() => setSelected(null)} />}
    </div>
  )
}