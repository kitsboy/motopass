import { PrefetchNavLink } from './PrefetchNavLink'
import { useI18n } from '../../i18n/I18nContext'
import { useUser } from '../../context/UserContext'

const PRIMARY = [
  { to: '/', key: 'nav.pitch' as const, end: true },
  { to: '/programs', key: 'nav.programs' as const },
  { to: '/portfolio', key: 'nav.portfolio' as const },
] as const

const TOOLS = [
  { to: '/btcmap', key: 'nav.btcmap' as const },
  { to: '/simulator', key: 'nav.simulator' as const },
  { to: '/compare', key: 'nav.compare' as const },
  { to: '/vault', key: 'nav.vault' as const },
  { to: '/verify', key: 'nav.verify' as const },
  { to: '/blog', key: 'nav.blog' as const },
  { to: '/agents', key: 'nav.agents' as const },
  { to: '/apply', key: 'nav.apply' as const },
] as const

export function DesktopNav() {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()

  const pill = (isActive: boolean) =>
    isActive ? 'nav-pill nav-pill-active' : 'nav-pill'

  return (
    <nav
      className="hidden lg:block border-t border-mp/50 bg-gradient-to-b from-card-muted/40 to-card/80"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="nav-section-label shrink-0">{t('nav.explore')}</span>
        <div className="flex items-center gap-0.5 shrink-0">
          {PRIMARY.map(n => (
            <PrefetchNavLink key={n.to} to={n.to} end={'end' in n ? n.end : false} className={({ isActive }) => pill(isActive)}>
              {t(n.key)}
            </PrefetchNavLink>
          ))}
        </div>
        <span className="nav-divider" aria-hidden="true" />
        <span className="nav-section-label shrink-0">{t('nav.tools')}</span>
        <div className="flex items-center gap-0.5 min-w-0">
          {TOOLS.map(n => (
            <PrefetchNavLink key={n.to} to={n.to} className={({ isActive }) => pill(isActive)}>
              {t(n.key)}
            </PrefetchNavLink>
          ))}
        </div>
        <span className="nav-divider ml-auto shrink-0" aria-hidden="true" />
        <PrefetchNavLink
          to={isLoggedIn ? '/dashboard' : '/register'}
          className={({ isActive }) => (isActive ? 'nav-pill nav-pill-violet' : 'nav-pill nav-pill-violet-muted')}
        >
          {isLoggedIn ? t('nav.dashboard') : t('nav.register')}
        </PrefetchNavLink>
      </div>
    </nav>
  )
}