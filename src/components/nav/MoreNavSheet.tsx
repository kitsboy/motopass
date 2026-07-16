import { useEffect, useRef, useState } from 'react'
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
  const swipeStartY = useRef<number | null>(null)
  const [dragY, setDragY] = useState(0)
  const reduced = useReducedMotion()
  useFocusTrap(panelRef, open, onClose)

  const instant = { duration: 0 } as const
  const panelTransition = reduced ? instant : { type: 'spring' as const, damping: 30, stiffness: 340 }

  const resetSwipe = () => {
    swipeStartY.current = null
    setDragY(0)
  }

  useEffect(() => {
    if (!open) resetSwipe()
  }, [open])

  const onSwipeStart = (clientY: number) => {
    swipeStartY.current = clientY
    setDragY(0)
  }

  const onSwipeMove = (clientY: number) => {
    if (swipeStartY.current == null) return
    setDragY(Math.max(0, clientY - swipeStartY.current))
  }

  const onSwipeEnd = () => {
    if (dragY >= SWIPE_CLOSE_THRESHOLD) onClose()
    resetSwipe()
  }

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
            transition={reduced ? instant : { duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.more')}
            className="absolute inset-x-0 bottom-0 mobile-nav-glass rounded-t-2xl safe-bottom more-nav-sheet-panel"
            initial={reduced ? { y: 0, opacity: 1 } : { y: '100%' }}
            animate={{ y: dragY, opacity: 1 }}
            exit={reduced ? { y: 0, opacity: 0 } : { y: '100%' }}
            transition={panelTransition}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse' && e.button !== 0) return
              onSwipeStart(e.clientY)
            }}
            onPointerMove={(e) => {
              if (swipeStartY.current == null) return
              onSwipeMove(e.clientY)
            }}
            onPointerUp={onSwipeEnd}
            onPointerCancel={resetSwipe}
          >
            <div
              className="mx-auto w-10 h-1 rounded-full bg-btc-orange/30 mt-2 mb-1 touch-none"
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
            <nav className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-3 pb-5 overflow-y-auto overscroll-contain min-h-0" aria-label="More navigation">
              {MORE_ROUTES.map(n => (
                <PrefetchNavLink
                  key={n.to}
                  to={n.to}
                  onClick={onClose}
                  className={({ isActive }) => navTileClass(isActive)}
                >
                  {t(n.key)}
                </PrefetchNavLink>
              ))}
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}