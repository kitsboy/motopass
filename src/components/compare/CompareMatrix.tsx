import { Fragment } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { Program } from '../../types/program'
import type { CinematicProgram } from '../programs/types'
import type { CompareRow } from './types'
import { COMPARE_GROUPS } from './types'
import { bestIndex } from './compareUtils'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/translations'
import { formatT } from '../../i18n/format'

interface CompareMatrixProps {
  programs: Program[]
  rows: CompareRow[]
  onOpenProgram: (program: CinematicProgram) => void
  toCinematic: (p: Program) => CinematicProgram
}

function groupLabel(group: (typeof COMPARE_GROUPS)[number], t: (k: TranslationKey) => string): string {
  const map: Record<(typeof COMPARE_GROUPS)[number], TranslationKey> = {
    finance: 'compare.groupFinance',
    timeline: 'compare.groupTimeline',
    scores: 'compare.groupScores',
    stack: 'compare.groupStack',
  }
  return t(map[group])
}

/** Plain-English "what does this metric mean" fallback shown on hover of any cell in that row. */
const METRIC_MEANING: Record<string, string> = {
  minInvestment: 'Minimum investment to start this program.',
  typical: 'Typical investment most members make for this program.',
  govFees: 'Government / filing fees charged by the jurisdiction.',
  processing: 'Estimated processing time, in months.',
  btcScore: 'Bitcoin-friendliness score (0–10).',
  sovereignty: 'Sovereignty score (0–10) — how much control you keep over your path.',
  synergy: 'How well this program stacks with others in the family.',
  btcIntegration: 'Depth of Bitcoin-native integration in the program.',
  risk: 'Risk level of the jurisdiction / program.',
  lightning: 'Whether Lightning payments are supported.',
}

/** Resolve the row's plain-English meaning (explicit meaning, else label-keyed fallback). */
function rowMeaning(r: CompareRow): string {
  if (r.meaning) return r.meaning
  const keys: [string, string][] = [
    ['compare.minInvestment', 'minInvestment'],
    ['compare.typical', 'typical'],
    ['compare.govFees', 'govFees'],
    ['compare.processing', 'processing'],
    ['compare.btcScore', 'btcScore'],
    ['compare.sovereignty', 'sovereignty'],
    ['compare.synergy', 'synergy'],
    ['compare.btcIntegration', 'btcIntegration'],
    ['compare.risk', 'risk'],
    ['compare.lightning', 'lightning'],
  ]
  const found = keys.find(([k]) => r.label === k)
  return found ? METRIC_MEANING[found[1]] : 'Comparison figure shown for member evaluation.'
}

export function CompareMatrix({ programs, rows, onOpenProgram, toCinematic }: CompareMatrixProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      id="compare-results"
      className="fc-matrix scroll-mt-header"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Desktop matrix */}
      <div className="fc-matrix__desktop hidden lg:block">
        <div className="fc-matrix__table-wrap">
          <table className="fc-matrix__table" aria-label={t('compare.title')}>
            <caption className="sr-only">{t('compare.title')}</caption>
            <thead>
              <tr>
                <th scope="col" className="fc-matrix__corner">
                  {t('compare.metric')}
                </th>
                {programs.map(p => (
                  <th key={p.id} scope="col" className="fc-matrix__program-head">
                    <button
                      type="button"
                      onClick={() => onOpenProgram(toCinematic(p))}
                      className="fc-matrix__program-btn"
                      aria-label={formatT(t, 'compare.openProgram', { name: p.name })}
                    >
                      <span className="fc-matrix__program-flag">{p.flag}</span>
                      <span className="fc-matrix__program-name">{p.name}</span>
                      <span className="fc-matrix__program-region">{p.region}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_GROUPS.map(group => {
                const groupRows = rows.filter(r => r.group === group)
                if (!groupRows.length) return null
                return (
                  <Fragment key={group}>
                    <tr className="fc-matrix__group-row">
                      <th colSpan={programs.length + 1} scope="colgroup" className="fc-matrix__group-label">
                        {groupLabel(group, t)}
                      </th>
                    </tr>
                    {groupRows.map(r => {
                      const nums = programs.map(p => r.numeric(p))
                      const bests = r.best ? bestIndex(nums, r.best) : new Set<number>()
                      return (
                        <tr key={r.label} className="fc-matrix__row">
                          <th scope="row" className="fc-matrix__metric">
                            {r.label}
                          </th>
                          {programs.map((p, i) => (
                            <td
                              key={p.id}
                              className={`fc-matrix__cell${bests.has(i) ? ' fc-matrix__cell--best' : ''}`}
                              title={`${r.label} — ${rowMeaning(r)}`}
                            >
                              {bests.has(i) && (
                                <span className="fc-matrix__best-badge">{t('compare.best')}</span>
                              )}
                              {r.render(p)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile horizontal scroll matrix */}
      <div className="fc-matrix__mobile lg:hidden">
        <div className="fc-scroll-matrix">
          <div className="fc-scroll-matrix__metrics">
            <div className="fc-scroll-matrix__corner">{t('compare.metric')}</div>
            {COMPARE_GROUPS.map(group => {
              const groupRows = rows.filter(r => r.group === group)
              if (!groupRows.length) return null
              return (
                <div key={group} className="fc-scroll-matrix__group">
                  <div className="fc-scroll-matrix__group-label">{groupLabel(group, t)}</div>
                  {groupRows.map(r => (
                    <div key={r.label} className="fc-scroll-matrix__metric">
                      {r.label}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          <div className="fc-scroll-matrix__columns">
            {programs.map(p => (
              <div key={p.id} className="fc-scroll-matrix__col">
                <button
                  type="button"
                  onClick={() => onOpenProgram(toCinematic(p))}
                  className="fc-scroll-matrix__head"
                  aria-label={formatT(t, 'compare.openProgram', { name: p.name })}
                >
                  <span className="fc-scroll-matrix__flag">{p.flag}</span>
                  <span className="fc-scroll-matrix__name">{p.name}</span>
                </button>
                {COMPARE_GROUPS.map(group => {
                  const groupRows = rows.filter(r => r.group === group)
                  if (!groupRows.length) return null
                  return (
                    <div key={group} className="fc-scroll-matrix__group">
                      <div className="fc-scroll-matrix__group-spacer" aria-hidden />
                      {groupRows.map(r => {
                        const nums = programs.map(prog => r.numeric(prog))
                        const bests = r.best ? bestIndex(nums, r.best) : new Set<number>()
                        const progIdx = programs.indexOf(p)
                        const isBest = bests.has(progIdx)
                        return (
                          <div
                            key={r.label}
                            className={`fc-scroll-matrix__value${isBest ? ' fc-scroll-matrix__value--best' : ''}`}
                            title={`${r.label} — ${rowMeaning(r)}`}
                          >
                            {isBest && <span className="fc-scroll-matrix__best">{t('compare.best')}</span>}
                            {r.render(p)}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}