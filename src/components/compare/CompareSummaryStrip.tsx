import { Crown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Program } from '../../types/program'
import type { CompareRow } from './types'
import { bestIndex, isKnown } from './compareUtils'
import { useI18n } from '../../i18n/I18nContext'
import { InfoTip } from '../ui/InfoTip'
import { CountryFlag, CountryTitle } from '../ui/CountryTitle'

interface CompareSummaryStripProps {
  programs: Program[]
  rows: CompareRow[]
}

const HIGHLIGHT_MEANING: Record<string, string> = {
  minInvestment: 'Lowest minimum investment among the compared programs that have one on file.',
}

export function CompareSummaryStrip({ programs, rows }: CompareSummaryStripProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  if (programs.length < 2) return null

  const minRow = rows.find(r => r.label === t('compare.minInvestment'))

  const highlights: { icon: typeof Crown; label: string; meaning: string; program: Program | null }[] = []

  // Only a figure that two or more programs actually have can produce a card.
  // "not on file" never wins, and a single known value has nothing to beat.
  if (minRow) {
    const nums = programs.map(p => minRow.numeric(p))
    const known = nums.filter(isKnown)
    const differing = new Set(known).size > 1
    if (known.length >= 2 && differing) {
      const idx = [...bestIndex(nums, 'min')][0]
      if (idx !== undefined) {
        highlights.push({
          icon: Crown,
          label: t('compare.minInvestment'),
          meaning: HIGHLIGHT_MEANING.minInvestment,
          program: programs[idx],
        })
      }
    }
  }

  // Sovereignty and BTC score are MotoPass ratings, not reported facts, so they
  // get a labelled metric row and no highlight card.

  if (!highlights.length) return null

  return (
    <motion.div
      className="fc-summary"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
    >
      {highlights.map(({ icon: Icon, label, meaning, program }) => (
        <InfoTip
          key={label}
          tip={
            <span>
              <strong className="font-mono font-semibold text-ink">{label}</strong>
              {program?.name ? (
                <>
                  {' · '}
                  <CountryFlag name={program.name} emoji={program.flag} size="sm" /> {program.name}
                </>
              ) : null}
              <span className="block mt-1 opacity-90">{meaning}</span>
            </span>
          }
          className="fc-summary__item"
        >
          <div className="fc-summary__item">
            <Icon size={14} className="fc-summary__icon" aria-hidden />
            <div className="fc-summary__copy">
              <span className="fc-summary__label">{label}</span>
              <span className="fc-summary__winner">
                {program?.name ? <CountryTitle name={program.name} emoji={program.flag} size="sm" /> : null}
              </span>
            </div>
          </div>
        </InfoTip>
      ))}
    </motion.div>
  )
}