import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n/I18nContext'
import { FOOTER_VERSION } from '../../lib/buildInfo'
import { MORE_ROUTES } from '../../lib/navRoutes'
import { PrefetchNavLink } from './PrefetchNavLink'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { navTileClass } from '../../lib/navRoutes'

const SWIPE_CLOSE_THRESHOLD = 72

export function MoreNavSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useFocusTrap(panelRef, open, onClose)

  const instant = { duration: 0 } as const
  // Snappy settle curve (--spring-snappy) for open; quick tween for close — no jank, no lingering exit.
  const panelTransition = reduced
    ? instant
    : {
        default: { duration: 0.34, ease: [0.34, 1.56, 0.64, 1] as const },
        exit: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
      }

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label={t('nav.close')}
            className="absolute inset-0 sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? instant : { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.more')}
            className="absolute inset-x-0 bottom-0 mobile-nav-glass rounded-t-2xl safe-bottom more-nav-sheet-panel"
            initial={reduced ? { y: 0, opacity: 1 } : { y: '100%' }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { y: 0, opacity: 0 } : { y: '100%' }}
            transition={panelTransition}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y >= SWIPE_CLOSE_THRESHOLD || info.velocity.y > 600) onClose()
            }}
            style={{ willChange: 'transform', transform: 'translateZ(0)', touchAction: 'pan-y' }}
          >
            <div
              className="mx-auto w-10 h-1 rounded-full mt-2 mb-1 touch-none"
              style={{ background: 'rgba(232, 121, 249, 0.3)' }}
              aria-hidden="true"
              data-swipe-handle
            />
            <div className="flex items-center justify-between px-4 py-2 border-b border-mp/50">
              <div className="min-w-0">
                <span className="font-chrome text-[10px] uppercase tracking-wider text-ink-muted">{t('nav.more')}</span>
                <span className="block font-mono text-[9px] text-ink-muted/80 truncate xs-only-build">{FOOTER_VERSION}</span>
              </div>
              <button type="button" onClick={onClose} className="nav-btn nav-btn-icon !h-8 !w-8" aria-label={t('nav.close')}>
                <X size={18} />
              </button>
            </div>
            <nav className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-3 pb-5 overflow-y-auto overscroll-contain min-h-0" aria-label={t('nav.moreNavigation')}>
              {MORE_ROUTES.map((n, i) => (
                <motion.div
                  key={n.to}
                  initial={reduced ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduced ? 0 : 0.03 + i * 0.028,
                    type: reduced ? 'tween' : 'spring',
                    stiffness: 380,
                    damping: 30,
                    mass: 0.7,
                  }}
                >
                  <PrefetchNavLink
                    to={n.to}
                    onClick={onClose}
                    className={({ isActive }) => navTileClass(isActive)}
                  >
                    {t(n.key)}
                  </PrefetchNavLink>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}