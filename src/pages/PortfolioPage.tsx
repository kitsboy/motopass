import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layers, Wallet, Zap, Radio, ChevronUp, ChevronDown, Link2 } from 'lucide-react'
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
import { formatT } from '../i18n/format'
import { BtcDualPrice } from '../components/BtcDualPrice'
import { ComplianceClock } from '../components/portfolio/ComplianceClock'
import { PaigeChat } from '../components/PaigeChat'
import { NostrConnect } from '../components/NostrConnect'
import { Card } from '../components/ui/Card'
import { hasFlagshipDepth } from '../components/programs/types'
import { decodePortfolioStackParam, portfolioShareUrl } from '../lib/urlState'
import { savePortfolio } from '../lib/portfolioStorage'
import { useToast } from '../components/ui/Toast'

type SortKey = 'order' | 'name' | 'score' | 'invest'

export function PortfolioPage() {
  const { t } = useI18n()
  const { programs, loading, error } = usePrograms()
  const { portfolio, toggle: togglePortfolio, clearAll, moveItem, reorder, setPortfolio } = usePortfolio()
  const { toast } = useToast()
  const [dragId, setDragId] = useState<number | null>(null)
  const [searchParams] = useSearchParams()
  const [selected, setSelected] = useState<CinematicProgram | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [tab, setTab] = useState<ProgramModalTab>('Overview')
  const [sort, setSort] = useState<SortKey>('order')
  const [removeAllOpen, setRemoveAllOpen] = useState(false)

  const acquired = useMemo(
    () => programs.filter((p) => portfolio.includes(p.id)),
    [programs, portfolio],
  )
  const cinematic = useMemo(() => {
    const list = toCinematicPrograms(acquired)
    if (sort === 'order') {
      const order = new Map(portfolio.map((id, index) => [id, index]))
      return [...list].sort((a, b) => {
        const ai = order.get(cinematicIdToNumber(a.id)) ?? 0
        const bi = order.get(cinematicIdToNumber(b.id)) ?? 0
        return ai - bi
      })
    }
    return [...list].sort((a, b) => {
      if (sort === 'score') return (b.cryptoFriendlyScore ?? 0) - (a.cryptoFriendlyScore ?? 0)
      if (sort === 'invest') return b.minInvestment - a.minInvestment
      return a.country.localeCompare(b.country)
    })
  }, [acquired, sort, portfolio])
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

  useEffect(() => {
    const stack = decodePortfolioStackParam(searchParams.get('stack'))
    if (!stack.length) return
    savePortfolio(stack)
    setPortfolio(stack)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- hydrate shared stack once

  const handleReorderDrop = (targetId: number) => {
    if (dragId == null || dragId === targetId || sort !== 'order') return
    const next = [...portfolio]
    const from = next.indexOf(dragId)
    const to = next.indexOf(targetId)
    if (from < 0 || to < 0) return
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    reorder(next)
    setDragId(null)
    toast(t('portfolio.reorderSaved'), 'success')
  }

  const handleCopyShareUrl = async () => {
    const url = portfolioShareUrl(portfolio, window.location.origin)
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2000)
    } catch {
      setShareCopied(false)
    }
  }

  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-7xl mx-auto">
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
                <option value="order">{t('portfolio.sortOrder')}</option>
                <option value="name">{t('portfolio.sortName')}</option>
                <option value="score">{t('portfolio.sortScore')}</option>
                <option value="invest">{t('portfolio.sortInvest')}</option>
              </select>
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className="chip text-xs inline-flex items-center gap-1"
                title={shareCopied ? t('portfolio.shareCopied') : t('portfolio.shareUrl')}
              >
                <Link2 size={12} aria-hidden="true" />
                {shareCopied ? t('portfolio.shareCopied') : t('portfolio.shareUrl')}
              </button>
              <button type="button" onClick={() => setRemoveAllOpen(true)} className="chip text-xs hover:!text-status-red">
                {t('portfolio.removeAll')}
              </button>
            </div>
          ) : undefined
        }
      />

      <Card variant="banner" animate className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-chrome text-xs font-semibold text-mp-btc-text uppercase tracking-wide">Nostr identity</p>
          <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
            Connect npub before Apply — agents route deal rooms and proof updates through your sovereign key.
          </p>
        </div>
        <NostrConnect />
      </Card>

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
        {cinematic.map((p, i) => {
          const id = cinematicIdToNumber(p.id)
          const stackIndex = portfolio.indexOf(id)
          const canMoveUp = sort === 'order' && stackIndex > 0
          const canMoveDown = sort === 'order' && stackIndex >= 0 && stackIndex < portfolio.length - 1
          return (
            <div
              key={p.id}
              className={`relative ${sort === 'order' ? 'portfolio-drag-item' : ''}`}
              draggable={sort === 'order'}
              onDragStart={() => setDragId(id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => { if (sort === 'order') e.preventDefault() }}
              onDrop={() => handleReorderDrop(id)}
            >
              {sort === 'order' && (
                <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={!canMoveUp}
                    onClick={() => moveItem(id, 'up')}
                    aria-label={formatT(t, 'portfolio.moveUp', { name: p.country })}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-mp-border bg-mp-card text-mp-ink-secondary transition-colors hover:border-mp-btc/40 hover:text-mp-btc-text disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronUp size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveDown}
                    onClick={() => moveItem(id, 'down')}
                    aria-label={formatT(t, 'portfolio.moveDown', { name: p.country })}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-mp-border bg-mp-card text-mp-ink-secondary transition-colors hover:border-mp-btc/40 hover:text-mp-btc-text disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
              <ProgramCard
                program={p}
                index={i}
                inPortfolio
                onTogglePortfolio={handleTogglePortfolio}
                onSelect={(prog) => { setSelected(prog); setTab('Overview') }}
              />
            </div>
          )
        })}
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