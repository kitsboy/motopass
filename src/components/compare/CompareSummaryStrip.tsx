import { Crown, Shield, Zap } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Program } from '../../types/program'
import type { CompareRow } from './types'
import { bestIndex } from './compareUtils'
import { useI18n } from '../../i18n/I18nContext'

interface CompareSummaryStripProps {
  programs: Program[]
  rows: CompareRow[]
}

export function CompareSummaryStrip({ programs, rows }: CompareSummaryStripProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  if (programs.length < 2) return null

  const minRow = rows.find(r => r.label === t('compare.minInvestment'))
  const sovRow = rows.find(r => r.label === t('compare.sovereignty'))
  const btcRow = rows.find(r => r.label === t('compare.btcScore'))

  const highlights: { icon: typeof Crown; label: string; program: Program | null }[] = []

  if (minRow) {
    const nums = programs.map(p => minRow.numeric(p))
    const best = bestIndex(nums, 'min')
    const idx = [...best][0]
    highlights.push({
      icon: Crown,
      label: t('compare.minInvestment'),
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
      {valid.map(({ icon: Icon, label, program }) => (
        <div key={label} className="fc-summary__item">
          <Icon size={14} className="fc-summary__icon" aria-hidden />
          <div className="fc-summary__copy">
            <span className="fc-summary__label">{label}</span>
            <span className="fc-summary__winner">
              {program?.flag} {program?.name}
            </span>
          </div>
        </div>
      ))}
    </motion.div>
  )
}