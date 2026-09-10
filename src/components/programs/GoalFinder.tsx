import { useMemo, useState } from 'react'
import { Compass, RotateCcw, Target, Clock, Wallet, Shield } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import type { Program } from '../../types/program'
import { parseMonthsToDays } from '../../lib/programAdapter'
import { useI18n } from '../../i18n/I18nContext'
import { BtcDualPrice } from '../BtcDualPrice'

type Budget = 'any' | '50k' | '150k' | '500k'
type Timeline = 'any' | '6mo' | '12mo' | '24mo'
type Goal = 'residency' | 'citizenship' | 'fastest'

interface GoalFinderProps {
  programs: Program[]
  onOpenProgram?: (program: Program) => void
}

const BUDGET_CAPS: Record<Exclude<Budget, 'any'>, number> = { '50k': 50_000, '150k': 150_000, '500k': 500_000 }
const TIMELINE_CAPS: Record<Exclude<Timeline, 'any'>, number> = { '6mo': 183, '12mo': 365, '24mo': 730 }

/**
 * Goal-based path finder: pick budget + timeline + goal, get the matching
 * programs ranked by sovereignty. Pure client-side scoring over the live
 * corpus — no network, no state beyond the URL-free local inputs.
 */
export function GoalFinder({ programs, onOpenProgram }: GoalFinderProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const [budget, setBudget] = useState<Budget>('any')
  const [timeline, setTimeline] = useState<Timeline>('any')
  const [goal, setGoal] = useState<Goal>('residency')

  const active = budget !== 'any' || timeline !== 'any' || goal !== 'residency'

  const results = useMemo(() => {
    if (!active) return []
    const budgetCap = budget === 'any' ? Infinity : BUDGET_CAPS[budget]
    const daysCap = timeline === 'any' ? Infinity : TIMELINE_CAPS[timeline]

    const scored = programs
      .filter(p => {
        if (p.status && p.status.toLowerCase() !== 'active') return false
        const min = p.finance.min_investment_usd ?? p.finance.typical_investment_usd ?? 0
        if (min > budgetCap) return false
        if (parseMonthsToDays(p.finance.processing_time_months) > daysCap) return false
        if (goal === 'citizenship' && !p.category.includes('citizenship') && !p.category.includes('rbi_cbi')) return false
        if (goal === 'residency' && p.category.includes('citizenship') && !p.category.includes('rbi_cbi') && !p.category.includes('residency')) return false
        return true
      })
      .map(p => {
        const sov = p.sovereignty_score ?? 5
        const days = parseMonthsToDays(p.finance.processing_time_months)
        const min = p.finance.min_investment_usd ?? p.finance.typical_investment_usd ?? 0
        // Rank: sovereignty leads; cheaper + faster break ties. Fastest goal flips the speed weight.
        const score = goal === 'fastest'
          ? sov * 2 - days / 60 - min / 500_000
          : sov * 4 - days / 120 - min / 1_000_000
        return { program: p, sov, days, min, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
    return scored
  }, [programs, budget, timeline, goal, active])

  const chip = (selected: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
      selected
        ? 'border-btc-orange/60 bg-btc-orange/10 text-btc-orange-deep dark:text-mp-btc-text'
        : 'border-mp-border bg-section text-ink-muted hover:border-btc-orange/30 hover:text-ink'
    }`

  return (
    <section className="mb-8" aria-labelledby="goal-finder-title">
      <div className="glass-card !p-5">
        <div className="flex items-center gap-2 mb-4">
          <Compass size={18} className="text-btc-orange" aria-hidden />
          <h2 id="goal-finder-title" className="font-display font-semibold text-ink text-base">
            {t('programs.goalFinder.title')}
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-chrome uppercase tracking-wide text-ink-muted mb-1.5">
              <Wallet size={12} aria-hidden /> {t('programs.goalFinder.budget')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(['any', '50k', '150k', '500k'] as Budget[]).map(b => (
                <button key={b} type="button" onClick={() => setBudget(b)} className={chip(budget === b)} aria-pressed={budget === b}>
                  {b === 'any' ? t('programs.goalFinder.any') : `$${b.replace('k', 'k')}`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-chrome uppercase tracking-wide text-ink-muted mb-1.5">
              <Clock size={12} aria-hidden /> {t('programs.goalFinder.timeline')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(['any', '6mo', '12mo', '24mo'] as Timeline[]).map(tl => (
                <button key={tl} type="button" onClick={() => setTimeline(tl)} className={chip(timeline === tl)} aria-pressed={timeline === tl}>
                  {tl === 'any' ? t('programs.goalFinder.any') : `≤ ${tl.replace('mo', '')} ${t('programs.goalFinder.months')}`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-chrome uppercase tracking-wide text-ink-muted mb-1.5">
              <Target size={12} aria-hidden /> {t('programs.goalFinder.goal')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(['residency', 'citizenship', 'fastest'] as Goal[]).map(g => (
                <button key={g} type="button" onClick={() => setGoal(g)} className={chip(goal === g)} aria-pressed={goal === g}>
                  {t(`programs.goalFinder.goal.${g}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {results.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-mp/60">
                <p className="text-xs text-ink-muted mb-2">
                  {results.length} {t('programs.goalFinder.matches')}
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {results.map(({ program: p, sov, days, min }) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => onOpenProgram?.(p)}
                        className="w-full text-left flex items-center gap-3 rounded-mp-md border border-mp-border bg-card px-3 py-2.5 transition-colors hover:border-btc-orange/40 hover:bg-section"
                      >
                        <span className="text-lg leading-none" aria-hidden>{p.flag ?? '🏴'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-ink truncate">{p.name}</span>
                          <span className="flex items-center gap-2 text-[11px] text-ink-muted mt-0.5">
                            <Shield size={10} className="text-mp-proof" aria-hidden /> {sov}/10
                            <Clock size={10} aria-hidden /> {Math.round(days / 30)}mo
                            <Wallet size={10} aria-hidden /> <BtcDualPrice usd={min} size="xs" layout="inline" />
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {active && results.length === 0 && (
          <p className="mt-4 pt-4 border-t border-mp/60 text-sm text-ink-muted flex items-center gap-2">
            <RotateCcw size={13} aria-hidden />
            {t('programs.goalFinder.noMatches')}
          </p>
        )}
      </div>
    </section>
  )
}
