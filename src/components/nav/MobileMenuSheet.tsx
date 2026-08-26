import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PrefetchNavLink } from './PrefetchNavLink'
import { ApplyNavLink } from './ApplyNavLink'
import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { useI18n } from '../../i18n/I18nContext'
import { LanguageDropdown } from './LanguageDropdown'
import { CurrencyDropdown } from './CurrencyDropdown'
import { MenuCommandCenter } from './menu/MenuCommandCenter'
import { MenuDiscover } from './menu/MenuDiscover'
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

  // Fast, premium, transform-only (x/opacity — never layout-affecting props, so no CLS).
  // Uses the design system's own snappy settle curve (--spring-snappy). Quick open with a
  // slight overshoot, quick tween close so it snaps shut — no lag, no lingering exit.
  const panelTransition = reduceMotion
    ? { duration: 0 }
    : {
        default: { duration: 0.34, ease: [0.34, 1.56, 0.64, 1] as const },
        exit: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
      }
  const backdropTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }

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
            transition={backdropTransition}
            onClick={onClose}
          />

          <motion.aside
            className="elite-mobile-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
            {...panelMotion}
            transition={panelTransition}
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
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

            <nav className="elite-mobile-drawer__nav" aria-label={t('nav.mainNavigation')}>
              <MenuCommandCenter onClose={onClose} />
              {MAIN_NAV_ROUTES.filter(n => !n.apply).map((n, i) => (
                <motion.div
                  key={n.to}
                  initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.03 + i * 0.035,
                    type: reduceMotion ? 'tween' : 'spring',
                    stiffness: 380,
                    damping: 30,
                    mass: 0.7,
                  }}
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
              <MenuDiscover onClose={onClose} />
            </nav>

            <footer className="elite-mobile-drawer__footer">
              <div className="flex items-center gap-2 px-3 pb-2">
                <LanguageDropdown size="menu" />
                <CurrencyDropdown size="menu" />
              </div>
              <ApplyNavLink layout="drawer-cta" onClick={onClose} />
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}