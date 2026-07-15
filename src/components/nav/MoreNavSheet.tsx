import { useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n/I18nContext'
import { MORE_ROUTES } from '../../lib/navRoutes'
import { PrefetchNavLink } from './PrefetchNavLink'
import { ApplyNavLink } from './ApplyNavLink'
import { useFocusTrap } from '../../hooks/useFocusTrap'

export function MoreNavSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useFocusTrap(panelRef, open, onClose)

  return (
    <AnimatePresence>
      {open && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label={t('nav.close')}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : undefined}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.more')}
            className="absolute inset-x-0 bottom-0 bg-card border-t border-mp rounded-t-2xl shadow-card-hover safe-bottom"
            initial={reduced ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reduced ? undefined : { y: '100%' }}
            transition={reduced ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 340 }}
          >
            <div className="mx-auto w-10 h-1 rounded-full bg-mp/80 mt-2 mb-1" aria-hidden="true" />
            <div className="flex items-center justify-between px-4 py-2 border-b border-mp/50">
              <span className="font-display font-semibold text-sm text-ink">{t('nav.more')}</span>
              <button type="button" onClick={onClose} className="nav-btn nav-btn-icon !h-8 !w-8" aria-label={t('nav.close')}>
                <X size={18} />
              </button>
            </div>
            <nav className="grid grid-cols-3 gap-1.5 p-3 pb-5">
              {MORE_ROUTES.filter(n => n.to !== '/apply').map(n => (
                <PrefetchNavLink
                  key={n.to}
                  to={n.to}
                  onClick={onClose}
                  className={({ isActive }) => `nav-mobile-tile ${isActive ? 'nav-mobile-tile-active' : ''}`}
                >
                  {t(n.key)}
                </PrefetchNavLink>
              ))}
              <ApplyNavLink layout="tile" onClick={onClose} />
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}