import { Link, NavLink } from 'react-router-dom'
import { ExternalLink, User, UserPlus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { BlockHeight } from '../BlockHeight'
import { NostrConnect } from '../NostrConnect'
import { ThemeToggle } from '../ThemeToggle'
import { LanguageDropdown } from './LanguageDropdown'
import { useI18n } from '../../i18n/I18nContext'
import { useUser } from '../../context/UserContext'

const EXPLORE = [
  { to: '/', key: 'nav.pitch' as const, end: true },
  { to: '/programs', key: 'nav.programs' as const },
  { to: '/portfolio', key: 'nav.portfolio' as const },
] as const

const TOOLS = [
  { to: '/simulator', key: 'nav.simulator' as const },
  { to: '/compare', key: 'nav.compare' as const },
  { to: '/vault', key: 'nav.vault' as const },
  { to: '/verify', key: 'nav.verify' as const },
  { to: '/blog', key: 'nav.blog' as const },
  { to: '/agents', key: 'nav.agents' as const },
] as const

export function MobileMenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()

  const gridLink = (isActive: boolean) =>
    `nav-mobile-tile ${isActive ? 'nav-mobile-tile-active' : ''}`

  return (
    <AnimatePresence initial={false}>
      {open && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="lg:hidden overflow-hidden border-t border-mp/70 bg-card/95"
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

        <div>
          <p className="nav-section-label mb-1.5 px-0.5">{t('nav.explore')}</p>
          <nav className="grid grid-cols-3 gap-1.5">
            {EXPLORE.map(n => (
              <NavLink key={n.to} to={n.to} end={'end' in n ? n.end : false} onClick={onClose} className={({ isActive }) => gridLink(isActive)}>
                {t(n.key)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <p className="nav-section-label mb-1.5 px-0.5">{t('nav.tools')}</p>
          <nav className="grid grid-cols-3 gap-1.5">
            {TOOLS.map(n => (
              <NavLink key={n.to} to={n.to} onClick={onClose} className={({ isActive }) => gridLink(isActive)}>
                {t(n.key)}
              </NavLink>
            ))}
          </nav>
        </div>

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