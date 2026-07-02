import { useState } from 'react'
import { usePrograms } from '../hooks/usePrograms'
import { CardSkeleton } from '../components/LoadingSkeleton'

export function FinanceComparePage() {
  const { programs, loading } = usePrograms()
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
      <div className="section-label mb-1">FINANCE COMPARE</div>
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-2">Side-by-side comparison</h1>
      <p className="text-sm text-sovereign-silver mb-6">Select up to 4 programs</p>

      {loading && <CardSkeleton count={4} />}
      {!loading && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {programs.map(p => (
              <button key={p.id} type="button" onClick={() => toggle(p.id)}
                className={`text-xs px-3 py-1.5 rounded-full border ${ids.includes(p.id) ? 'border-btc-orange text-btc-orange bg-btc-orange/10' : 'border-white/15 text-sovereign-silver'}`}>
                {p.flag} {p.name}
              </button>
            ))}
          </div>
          {compare.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-3 text-left text-sovereign-silver">Metric</th>
                    {compare.map(p => <th key={p.id} className="p-3 text-left">{p.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.label} className="border-b border-white/5">
                      <td className="p-3 text-sovereign-silver">{r.label}</td>
                      {compare.map(p => <td key={p.id} className="p-3 font-mono text-xs">{r.key(p)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sovereign-silver text-center py-12">Select programs to compare</p>
          )}
        </>
      )}
    </div>
  )
}