import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { ProgramCard } from '../components/ProgramCard'
import { useI18n } from '../i18n/I18nContext'
import type { Program } from '../types/program'

export function ProgramsPage() {
  const { t } = useI18n()
  const [programs, setPrograms] = useState<Program[]>([])
  const [filtered, setFiltered] = useState<Program[]>([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/research/countries.json')
      .then(r => r.json())
      .then(d => {
        const p: Program[] = d.programs || []
        setPrograms(p)
        setFiltered(p)
      })
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let r = [...programs]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.details.toLowerCase().includes(q) ||
        p.bitcoin_integration.toLowerCase().includes(q)
      )
    }
    if (region !== 'All') r = r.filter(p => p.region === region)
    setFiltered(r)
  }, [search, region, programs])

  const regions = ['All', ...Array.from(new Set(programs.map(p => p.region)))]

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="section-label mb-1">{t('tagline')}</div>
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-6">{t('programs.title')}</h1>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('programs.search')}
          className="flex-1 bg-sovereign-void border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-btc-orange/50"
        />
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="bg-sovereign-void border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-btc-orange/50"
        >
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="button" onClick={() => { setSearch(''); setRegion('All') }} className="text-xs flex items-center justify-center gap-1 text-sovereign-silver hover:text-white px-3">
          <RefreshCw size={13} /> Reset
        </button>
      </div>

      {loading && <p className="text-sovereign-silver text-sm">Loading…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map(p => (
          <ProgramCard key={p.id} program={p} onClick={() => window.open('/website/index.html', '_blank')} />
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-center text-sovereign-silver py-12">No programs match.</p>
      )}

      <p className="text-center text-xs text-sovereign-silver mt-8">
        {programs.length} programs loaded • Full modals in <a href="/website/index.html" className="text-btc-orange hover:underline">pristine demo</a>
      </p>
    </div>
  )
}