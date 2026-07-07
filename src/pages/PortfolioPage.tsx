import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Layers, Wallet, Zap, Radio } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { usePortfolio } from '../hooks/usePortfolio'
import { toCinematicPrograms, cinematicIdToNumber } from '../lib/programAdapter'
import { ProgramCard } from '../components/programs/ProgramCard'
import { ProgramModal } from '../components/programs/ProgramModal'
import type { Program as CinematicProgram, ProgramModalTab } from '../components/programs/types'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { useI18n } from '../i18n/I18nContext'

export function PortfolioPage() {
  const { t } = useI18n()
  const { programs, loading, error } = usePrograms()
  const { portfolio, toggle: togglePortfolio } = usePortfolio()
  const [selected, setSelected] = useState<CinematicProgram | null>(null)
  const [tab, setTab] = useState<ProgramModalTab>('Overview')

  const acquired = useMemo(
    () => programs.filter((p) => portfolio.includes(p.id)),
    [programs, portfolio],
  )
  const cinematic = useMemo(() => toCinematicPrograms(acquired), [acquired])
  const totalInvest = acquired.reduce((s, p) => s + (p.finance.typical_investment_usd ?? 0), 0)
  const avgScore = acquired.length
    ? acquired.reduce((s, p) => s + (p.finance.crypto_friendly_score ?? 0), 0) / acquired.length
    : 0

  const handleTogglePortfolio = (program: CinematicProgram) => {
    togglePortfolio(cinematicIdToNumber(program.id))
    if (selected?.id === program.id && portfolio.includes(cinematicIdToNumber(program.id))) {
      setSelected(null)
    }
  }

  const handleAddToStack = (program: CinematicProgram) => {
    togglePortfolio(cinematicIdToNumber(program.id))
    setSelected(null)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow={t('portfolio.eyebrow')} title={t('portfolio.title')} subtitle={t('portfolio.subtitle')} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <StatCard value={acquired.length} label={t('portfolio.statPrograms')} accent icon={<Layers size={18} />} />
        <StatCard value={`$${(totalInvest / 1000).toFixed(0)}k`} label={t('portfolio.statInvest')} icon={<Wallet size={18} />} />
        <StatCard value={avgScore.toFixed(1)} label={t('portfolio.statScore')} icon={<Zap size={18} />} />
        <StatCard value={acquired.filter((p) => p.lightning_ready).length} label={t('portfolio.statLightning')} icon={<Radio size={18} />} />
      </div>

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton />}
      {!loading && acquired.length === 0 && (
        <div className="text-center py-16 card-elevated max-w-md mx-auto">
          <p className="text-ink-secondary mb-6">{t('portfolio.empty')}</p>
          <Link to="/programs" className="btn-primary">{t('portfolio.explore')}</Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {cinematic.map((p, i) => (
          <ProgramCard
            key={p.id}
            program={p}
            index={i}
            inPortfolio
            onTogglePortfolio={handleTogglePortfolio}
            onSelect={(prog) => { setSelected(prog); setTab('Overview') }}
          />
        ))}
      </div>

      <ProgramModal
        program={selected}
        initialTab={tab}
        inPortfolio={selected ? portfolio.includes(cinematicIdToNumber(selected.id)) : false}
        onAddToStack={handleAddToStack}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}