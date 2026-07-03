import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Layers, Wallet, Zap, Radio } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { loadPortfolio } from '../lib/portfolioStorage'
import { ProgramCard } from '../components/ProgramCard'
import { ProgramModal, type ProgramModalTab } from '../components/ProgramModal'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
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
      <PageHeader eyebrow="MY PORTFOLIO" title="Acquired programs" subtitle="Programs you've marked as acquired in the explorer." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <StatCard value={acquired.length} label="Programs" accent icon={<Layers size={18} />} />
        <StatCard value={`$${(totalInvest / 1000).toFixed(0)}k`} label="Total invested" icon={<Wallet size={18} />} />
        <StatCard value={avgScore.toFixed(1)} label="Avg BTC score" icon={<Zap size={18} />} />
        <StatCard value={acquired.filter(p => p.lightning_ready).length} label="Lightning ready" icon={<Radio size={18} />} />
      </div>

      {loading && <CardSkeleton />}
      {!loading && acquired.length === 0 && (
        <div className="text-center py-16 card-elevated max-w-md mx-auto">
          <p className="text-ink-secondary mb-6">No programs in your portfolio yet.</p>
          <Link to="/programs" className="btn-primary">Explore programs</Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {acquired.map(p => (
          <ProgramCard key={p.id} program={p} onClick={() => { setSelected(p); setTab('Overview') }} />
        ))}
      </div>

      {selected && <ProgramModal program={selected} tab={tab} onTab={setTab} onClose={() => setSelected(null)} />}
    </div>
  )
}