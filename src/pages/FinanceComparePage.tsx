import { useState } from 'react'
import { usePrograms } from '../hooks/usePrograms'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { PageHeader } from '../components/ui/PageHeader'

export function FinanceComparePage() {
  const { programs, loading, error } = usePrograms()
  const [ids, setIds] = useState<number[]>([])

  const toggle = (id: number) => {
    setIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  const compare = programs.filter(p => ids.includes(p.id))
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
          <div className="flex flex-wrap gap-2 mb-8">
            {programs.map(p => (
              <button key={p.id} type="button" onClick={() => toggle(p.id)} className={ids.includes(p.id) ? 'chip-active' : 'chip'}>
                {p.flag} {p.name}
              </button>
            ))}
          </div>
          {compare.length > 0 ? (
            <div className="overflow-x-auto rounded-mp-lg border border-mp bg-card shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mp bg-section/60">
                    <th scope="col" className="p-3 text-left text-ink-muted text-xs uppercase">Metric</th>
                    {compare.map(p => <th key={p.id} scope="col" className="p-3 text-left font-display text-ink">{p.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.label} className="border-b border-mp/60 hover:bg-btc-orange-soft/20">
                      <th scope="row" className="p-3 text-left text-ink-muted font-medium">{r.label}</th>
                      {compare.map(p => <td key={p.id} className="p-3 font-mono text-xs text-ink">{r.key(p)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 card-muted text-ink-muted">Select programs to compare</div>
          )}
        </>
      )}
    </div>
  )
}