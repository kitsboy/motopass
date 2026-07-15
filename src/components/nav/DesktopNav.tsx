import { PrefetchNavLink } from './PrefetchNavLink'
import { ApplyNavLink } from './ApplyNavLink'
import { useI18n } from '../../i18n/I18nContext'
import { useUser } from '../../context/UserContext'
import { MAIN_NAV_ROUTES, navPillClass } from '../../lib/navRoutes'

export function DesktopNav() {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()

  return (
    <nav
      className="hidden lg:block border-t border-mp/40 bg-card-muted/30 backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {MAIN_NAV_ROUTES.map(n =>
          n.apply ? (
            <ApplyNavLink key={n.to} />
          ) : (
            <PrefetchNavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => navPillClass(isActive)}
            >
              {t(n.key)}
            </PrefetchNavLink>
          ),
        )}
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