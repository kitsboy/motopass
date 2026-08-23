import { Crown, Shield, Zap } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Program } from '../../types/program'
import type { CompareRow } from './types'
import { bestIndex } from './compareUtils'
import { useI18n } from '../../i18n/I18nContext'
import { InfoTip } from '../ui/InfoTip'

interface CompareSummaryStripProps {
  programs: Program[]
  rows: CompareRow[]
}

const HIGHLIGHT_MEANING: Record<string, string> = {
  minInvestment: 'Lowest minimum investment among the compared programs — the cheapest entry point to begin.',
  sovereignty: 'Highest sovereignty score (0–10) — the program that gives you the most control over your path.',
  btcScore: 'Highest Bitcoin-friendliness score (0–10) — best fit for a Bitcoin-native stack.',
}

export function CompareSummaryStrip({ programs, rows }: CompareSummaryStripProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  if (programs.length < 2) return null

  const minRow = rows.find(r => r.label === t('compare.minInvestment'))
  const sovRow = rows.find(r => r.label === t('compare.sovereignty'))
  const btcRow = rows.find(r => r.label === t('compare.btcScore'))

  const highlights: { icon: typeof Crown; label: string; meaning: string; program: Program | null }[] = []

  if (minRow) {
    const nums = programs.map(p => minRow.numeric(p))
    const best = bestIndex(nums, 'min')
    const idx = [...best][0]
    highlights.push({
      icon: Crown,
      label: t('compare.minInvestment'),
      meaning: HIGHLIGHT_MEANING.minInvestment,
      program: idx !== undefined ? programs[idx] : null,
    })
  }

  if (sovRow) {
    const nums = programs.map(p => sovRow.numeric(p))
    const best = bestIndex(nums, 'max')
    const idx = [...best][0]
    highlights.push({
      icon: Shield,
      label: t('compare.sovereignty'),
      meaning: HIGHLIGHT_MEANING.sovereignty,
      program: idx !== undefined ? programs[idx] : null,
    })
  }

  if (btcRow) {
    const nums = programs.map(p => btcRow.numeric(p))
    const best = bestIndex(nums, 'max')
    const idx = [...best][0]
    highlights.push({
      icon: Zap,
      label: t('compare.btcScore'),
      meaning: HIGHLIGHT_MEANING.btcScore,
      program: idx !== undefined ? programs[idx] : null,
    })
  }

  const valid = highlights.filter(h => h.program)
  if (!valid.length) return null

  return (
    <motion.div
      className="fc-summary"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
    >
      {valid.map(({ icon: Icon, label, meaning, program }) => (
        <InfoTip
          key={label}
          tip={
            <span>
              <strong className="font-mono font-semibold text-ink">{label}</strong> · {program?.flag}{' '}
              {program?.name}
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
                {program?.flag} {program?.name}
              </span>
            </div>
          </div>
        </InfoTip>
      ))}
    </motion.div>
  )
}