import { GitCompareArrows, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n/I18nContext'

interface CompareEmptyStateProps {
  onSuggestedPair?: () => void
  showSuggested: boolean
}

export function CompareEmptyState({ onSuggestedPair, showSuggested }: CompareEmptyStateProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      id="compare-results"
      className="fc-empty scroll-mt-header"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="fc-empty__icon-wrap" aria-hidden>
        <GitCompareArrows size={32} className="fc-empty__icon" />
      </div>
      <p className="fc-empty__copy">{t('compare.empty')}</p>
      {showSuggested && onSuggestedPair && (
        <div className="fc-empty__suggest">
          <p className="fc-empty__suggest-label">{t('compare.suggestPairs')}</p>
          <button type="button" onClick={onSuggestedPair} className="fc-empty__suggest-btn">
            <Sparkles size={16} aria-hidden />
            {t('compare.suggestUruguayBolivia')}
          </button>
        </div>
      )}
    </motion.div>
  )
}