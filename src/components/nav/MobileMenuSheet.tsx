import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PrefetchNavLink } from './PrefetchNavLink'
import { ApplyNavLink } from './ApplyNavLink'
import { ExternalLink, User, UserPlus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { BlockHeight } from '../BlockHeight'
import { NostrConnect } from '../NostrConnect'
import { ThemeToggle } from '../ThemeToggle'
import { LanguageDropdown } from './LanguageDropdown'
import { useI18n } from '../../i18n/I18nContext'
import { useUser } from '../../context/UserContext'
import { MAIN_NAV_ROUTES, navTileClass } from '../../lib/navRoutes'

export function MobileMenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="lg:hidden overflow-hidden border-t border-mp/40"
          style={{ background: 'var(--mp-glass-bg)', backdropFilter: 'blur(24px) saturate(1.45)' }}
        >
          <div className="px-4 pb-4 pt-3 space-y-3 max-h-[min(70vh,520px)] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-chrome text-[10px] uppercase tracking-wider text-ink-muted">{t('nav.menu')}</span>
              <button type="button" onClick={onClose} className="nav-btn nav-btn-icon !h-8 !w-8" aria-label={t('nav.close')}>
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <BlockHeight />
              <NostrConnect />
              <ThemeToggle compact />
            </div>

            <LanguageDropdown size="menu" />

            <Link
              to={isLoggedIn ? '/dashboard' : '/register'}
              onClick={onClose}
              className={isLoggedIn ? 'nav-btn nav-btn-primary w-full justify-center' : 'nav-btn nav-btn-violet w-full justify-center'}
            >
              {isLoggedIn ? <User size={14} /> : <UserPlus size={14} />}
              {isLoggedIn ? t('nav.dashboard') : t('nav.register')}
            </Link>

            <nav className="grid grid-cols-2 gap-1.5" aria-label="Main navigation">
              {MAIN_NAV_ROUTES.map(n =>
                n.apply ? (
                  <ApplyNavLink key={n.to} layout="tile" onClick={onClose} />
                ) : (
                  <PrefetchNavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    onClick={onClose}
                    className={({ isActive }) => navTileClass(isActive)}
                  >
                    {t(n.key)}
                  </PrefetchNavLink>
                ),
              )}
            </nav>

            <a
              href="/website/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn nav-btn-ghost w-full justify-center"
            >
              <ExternalLink size={14} />
              {t('nav.demo')}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}