import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PrefetchNavLink } from './PrefetchNavLink'
import { ApplyNavLink } from './ApplyNavLink'
import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { useI18n } from '../../i18n/I18nContext'
import { MAIN_NAV_ROUTES, eliteDrawerLinkClass } from '../../lib/navRoutes'

export function MobileMenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <div className="elite-mobile-drawer lg:hidden" role="presentation">
          <motion.button
            type="button"
            className="elite-mobile-drawer__backdrop"
            aria-label={t('nav.close')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
          />

          <motion.aside
            className="elite-mobile-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
            {...panelMotion}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="elite-mobile-drawer__header">
              <Link to="/" className="elite-mobile-drawer__brand" onClick={onClose}>
                <img
                  src="/logo.png"
                  alt=""
                  className="elite-mobile-drawer__brand-logo"
                  width={32}
                  height={32}
                  decoding="async"
                />
                <span className="elite-mobile-drawer__brand-name">MotoPass</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="elite-hamburger elite-hamburger--close"
                aria-label={t('nav.close')}
              >
                <X size={20} strokeWidth={2.25} />
              </button>
            </header>

            <nav className="elite-mobile-drawer__nav" aria-label="Main navigation">
              {MAIN_NAV_ROUTES.filter(n => !n.apply).map((n, i) => (
                <motion.div
                  key={n.to}
                  initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.04, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PrefetchNavLink
                    to={n.to}
                    end={n.end}
                    onClick={onClose}
                    className={({ isActive }) => eliteDrawerLinkClass(isActive)}
                  >
                    {t(n.key)}
                  </PrefetchNavLink>
                </motion.div>
              ))}
            </nav>

            <footer className="elite-mobile-drawer__footer">
              <ApplyNavLink layout="drawer-cta" onClick={onClose} />
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}