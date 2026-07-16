import { Download } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Program } from '../../types/program'
import type { CompareRow } from './types'
import { bestIndex } from './compareUtils'
import { compareDiffClass, compareDiffKind } from '../../lib/compareDiff'
import { useI18n } from '../../i18n/I18nContext'

interface CompareDiffSectionProps {
  programs: Program[]
  diffRows: CompareRow[]
  onExport: () => void
}

export function CompareDiffSection({ programs, diffRows, onExport }: CompareDiffSectionProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  if (programs.length < 2 || programs.length > 3) return null

  return (
    <motion.section
      id="compare-diff"
      className="fc-diff scroll-mt-header"
      aria-labelledby="compare-diff-heading"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="fc-diff__panel">
        <div className="fc-diff__head">
          <div>
            <h2 id="compare-diff-heading" className="fc-diff__title">
              {t('compare.diffTitle')}
            </h2>
            <p className="fc-diff__subtitle">{t('compare.diffSubtitle')}</p>
          </div>
          <button type="button" onClick={onExport} className="fc-diff__export">
            <Download size={15} aria-hidden />
            {t('compare.exportMarkdown')}
          </button>
        </div>

        {diffRows.length === 0 ? (
          <p className="fc-diff__empty">{t('compare.diffEmpty')}</p>
        ) : (
          <div className="fc-diff__table-wrap">
            <table className="fc-diff__table">
              <caption className="sr-only">{t('compare.diffTitle')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('compare.metric')}</th>
                  {programs.map(p => (
                    <th key={p.id} scope="col">
                      <span className="fc-diff__th-flag">{p.flag}</span> {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diffRows.map(r => {
                  const nums = programs.map(p => r.numeric(p))
                  const bests = r.best ? bestIndex(nums, r.best) : new Set<number>()
                  const baselineKey = r.valueKey(programs[0])
                  return (
                    <tr key={r.label}>
                      <th scope="row">{r.label}</th>
                      {programs.map((p, i) => {
                        const valueKey = r.valueKey(p)
                        const differs = valueKey !== baselineKey
                        const kind = compareDiffKind(valueKey, baselineKey, bests.has(i), differs)
                        const diffClass = compareDiffClass(kind)
                        return (
                          <td
                            key={p.id}
                            className={`${diffClass}${bests.has(i) ? ' fc-diff__cell--best' : ''}`.trim()}
                          >
                            {r.render(p)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.section>
  )
}