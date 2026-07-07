import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { PageHeader } from '../components/ui/PageHeader'

export function FinanceComparePage() {
  const { programs, loading, error } = usePrograms()
  const [ids, setIds] = useState<number[]>([])
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
  const rows = [
    { label: 'Min investment', key: (p: typeof compare[0]) => `$${(p.finance.min_investment_usd ?? 0).toLocaleString()}` },
    { label: 'Typical', key: (p: typeof compare[0]) => `$${(p.finance.typical_investment_usd ?? 0).toLocaleString()}` },
    { label: 'Gov fees', key: (p: typeof compare[0]) => `$${(p.finance.gov_fees_usd ?? 0).toLocaleString()}` },
    { label: 'Processing', key: (p: typeof compare[0]) => `${p.finance.processing_time_months ?? '—'} mo` },
    { label: 'BTC score', key: (p: typeof compare[0]) => `${p.finance.crypto_friendly_score ?? '—'}/10` },
    { label: 'Sovereignty', key: (p: typeof compare[0]) => `${p.sovereignty_score ?? '—'}/10` },
    { label: 'Risk', key: (p: typeof compare[0]) => p.risk_level ?? '—' },
    { label: 'Lightning', key: (p: typeof compare[0]) => p.lightning_ready ? 'Yes' : 'No' },
  ]

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow="FINANCE COMPARE" title="Side-by-side comparison" subtitle="Select up to 4 programs to compare key metrics." />

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton count={4} />}
      {!loading && !error && (
        <>
          <div className="mb-8">
            <label className="text-xs font-medium text-ink-muted mb-2 block">
              Programs to compare ({ids.length}/4)
            </label>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selected.map(p => (
                  <span key={p.id} className="chip-active inline-flex items-center gap-1.5 text-xs">
                    {p.flag} {p.name}
                    <button type="button" onClick={() => remove(p.id)} className="hover:text-status-red transition-colors" aria-label={`Remove ${p.name}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
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
                placeholder={ids.length >= 4 ? 'Maximum 4 programs selected' : 'Search and add programs…'}
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
                  No matching programs
                </div>
              )}
            </div>
          </div>

          {compare.length > 0 ? (
            <div className="overflow-x-auto rounded-card border border-mp-border bg-mp-card shadow-mp-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mp-border bg-mp-card-muted/60">
                    <th scope="col" className="p-3 text-left text-ink-muted text-xs uppercase">Metric</th>
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
              Search and select programs to compare
            </div>
          )}
        </>
      )}
    </div>
  )
}