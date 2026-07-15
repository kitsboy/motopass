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
import { ClassyModal } from '../components/ui/ClassyModal'
import { useI18n } from '../i18n/I18nContext'
import { BtcDualPrice } from '../components/BtcDualPrice'
import { ComplianceClock } from '../components/portfolio/ComplianceClock'
import { PaigeChat } from '../components/PaigeChat'
import { hasFlagshipDepth } from '../components/programs/types'

type SortKey = 'name' | 'score' | 'invest'

export function PortfolioPage() {
  const { t } = useI18n()
  const { programs, loading, error } = usePrograms()
  const { portfolio, toggle: togglePortfolio, clearAll } = usePortfolio()
  const [selected, setSelected] = useState<CinematicProgram | null>(null)
  const [tab, setTab] = useState<ProgramModalTab>('Overview')
  const [sort, setSort] = useState<SortKey>('name')
  const [removeAllOpen, setRemoveAllOpen] = useState(false)

  const acquired = useMemo(
    () => programs.filter((p) => portfolio.includes(p.id)),
    [programs, portfolio],
  )
  const cinematic = useMemo(() => {
    const list = toCinematicPrograms(acquired)
    return [...list].sort((a, b) => {
      if (sort === 'score') return (b.cryptoFriendlyScore ?? 0) - (a.cryptoFriendlyScore ?? 0)
      if (sort === 'invest') return b.minInvestment - a.minInvestment
      return a.country.localeCompare(b.country)
    })
  }, [acquired, sort])
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

  const confirmRemoveAll = () => {
    clearAll()
    setSelected(null)
    setRemoveAllOpen(false)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow={t('portfolio.eyebrow')}
        title={t('portfolio.title')}
        subtitle={t('portfolio.subtitle')}
        actions={
          acquired.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="portfolio-sort" className="text-xs text-ink-muted">{t('portfolio.sortBy')}</label>
              <select
                id="portfolio-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="select-field !py-1.5 !text-xs !w-auto"
              >
                <option value="name">{t('portfolio.sortName')}</option>
                <option value="score">{t('portfolio.sortScore')}</option>
                <option value="invest">{t('portfolio.sortInvest')}</option>
              </select>
              <button type="button" onClick={() => setRemoveAllOpen(true)} className="chip text-xs hover:!text-status-red">
                {t('portfolio.removeAll')}
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <StatCard value={acquired.length} label={t('portfolio.statPrograms')} accent icon={<Layers size={18} />} />
        <StatCard value={<BtcDualPrice usd={totalInvest} size="md" layout="stack" />} label={t('portfolio.statInvest')} icon={<Wallet size={18} />} />
        <StatCard value={avgScore.toFixed(1)} label={t('portfolio.statScore')} icon={<Zap size={18} />} />
        <StatCard value={acquired.filter((p) => p.lightning_ready).length} label={t('portfolio.statLightning')} icon={<Radio size={18} />} />
      </div>

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton />}
      {!loading && acquired.length === 0 && (
        <div className="text-center py-16 rounded-card border border-mp-border bg-mp-card shadow-mp-2 max-w-md mx-auto">
          <p className="text-ink-secondary mb-6">{t('portfolio.empty')}</p>
          <Link to="/programs" className="btn-primary">{t('portfolio.explore')}</Link>
        </div>
      )}
      {cinematic.some(hasFlagshipDepth) && (
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          {cinematic.filter(hasFlagshipDepth).map((p) => (
            <ComplianceClock key={p.id} program={p} />
          ))}
        </div>
      )}

      {acquired.length > 0 && (
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start">
          <div className="flex flex-wrap gap-3">
            <Link to="/simulator" className="chip text-xs text-accent hover:underline">Stack simulator →</Link>
            <Link to="/btcmap" className="chip text-xs text-mp-btc-text hover:underline">BTC Map merchants →</Link>
          </div>
          <PaigeChat compact />
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

      <ClassyModal
        open={removeAllOpen}
        onClose={() => setRemoveAllOpen(false)}
        closeLabel={t('modal.close')}
        title={t('portfolio.removeAllTitle')}
        subtitle={t('portfolio.removeAllConfirm')}
        maxWidth="md"
      >
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setRemoveAllOpen(false)} className="btn-secondary text-sm">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={confirmRemoveAll} className="btn-primary text-sm !bg-status-red hover:!bg-status-red/90">
            {t('portfolio.removeAll')}
          </button>
        </div>
      </ClassyModal>
    </div>
  )
}