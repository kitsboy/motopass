import { motion, useReducedMotion } from 'motion/react'
import { GitCompareArrows } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

export function CompareHero({ slotCount }: { slotCount: number }) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  const slots = Array.from({ length: 4 }, (_, i) => i < slotCount)

  return (
    <header className="fc-hero">
      <div className="fc-hero__ambient" aria-hidden />
      <motion.div
        className="fc-hero__content"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="fc-hero__badge">
          <GitCompareArrows size={14} aria-hidden />
          <span>{t('compare.eyebrow')}</span>
        </div>
        <h1 className="fc-hero__title">{t('compare.title')}</h1>
        <p className="fc-hero__subtitle">{t('compare.subtitle')}</p>

        <div className="fc-hero__slots" aria-label={formatT(t, 'compare.programsLabel', { count: slotCount })}>
          {slots.map((filled, i) => (
            <span
              key={i}
              className={`fc-hero__slot${filled ? ' fc-hero__slot--filled' : ''}`}
              aria-hidden
            />
          ))}
          <span className="fc-hero__slot-label">{formatT(t, 'compare.programsLabel', { count: slotCount })}</span>
        </div>
      </motion.div>
    </header>
  )
}