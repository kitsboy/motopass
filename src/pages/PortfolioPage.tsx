import { Link } from 'react-router-dom'
import { useState } from 'react'
import { usePrograms } from '../hooks/usePrograms'
import { loadPortfolio } from '../lib/portfolioStorage'
import { ProgramCard } from '../components/ProgramCard'
import { ProgramModal, type ProgramModalTab } from '../components/ProgramModal'
import { CardSkeleton } from '../components/LoadingSkeleton'
import type { Program } from '../types/program'

export function PortfolioPage() {
  const { programs, loading } = usePrograms()
  const [portfolio] = useState<number[]>(loadPortfolio)
  const [selected, setSelected] = useState<Program | null>(null)
  const [tab, setTab] = useState<ProgramModalTab>('Overview')

  const acquired = programs.filter(p => portfolio.includes(p.id))
  const totalInvest = acquired.reduce((s, p) => s + (p.finance.typical_investment_usd ?? 0), 0)
  const avgScore = acquired.length ? acquired.reduce((s, p) => s + (p.finance.crypto_friendly_score ?? 0), 0) / acquired.length : 0

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="section-label mb-1">MY PORTFOLIO</div>
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-6">Acquired programs</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="card text-center"><div className="text-2xl font-bold text-btc-orange">{acquired.length}</div><div className="text-xs text-sovereign-silver">Programs</div></div>
        <div className="card text-center"><div className="text-2xl font-bold">${(totalInvest / 1000).toFixed(0)}k</div><div className="text-xs text-sovereign-silver">Total invested</div></div>
        <div className="card text-center"><div className="text-2xl font-bold">{avgScore.toFixed(1)}</div><div className="text-xs text-sovereign-silver">Avg BTC score</div></div>
        <div className="card text-center"><div className="text-2xl font-bold">{acquired.filter(p => p.lightning_ready).length}</div><div className="text-xs text-sovereign-silver">Lightning ready</div></div>
      </div>

      {loading && <CardSkeleton />}
      {!loading && acquired.length === 0 && (
        <div className="text-center py-12 text-sovereign-silver">
          <p className="mb-4">No programs in your portfolio yet.</p>
          <Link to="/programs" className="btn-primary inline-block">Explore programs</Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {acquired.map(p => (
          <ProgramCard key={p.id} program={p} onClick={() => { setSelected(p); setTab('Overview') }} />
        ))}
      </div>

      {selected && <ProgramModal program={selected} tab={tab} onTab={setTab} onClose={() => setSelected(null)} />}
    </div>
  )
}