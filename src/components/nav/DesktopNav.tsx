import { PrefetchNavLink } from './PrefetchNavLink'
import { ApplyNavLink } from './ApplyNavLink'
import { useI18n } from '../../i18n/I18nContext'
import { useUser } from '../../context/UserContext'
import { MAIN_NAV_ROUTES, OVERFLOW_NAV_ROUTES, eliteNavLinkClass } from '../../lib/navRoutes'

const PRIMARY_ROUTES = MAIN_NAV_ROUTES.filter(r => !r.apply)

export function DesktopNav() {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()

  return (
    <nav className="elite-desktop-nav" aria-label="Main navigation">
      <div className="elite-desktop-nav__inner max-w-7xl mx-auto px-4 sm:px-6">
        <div className="elite-desktop-nav__links">
          {PRIMARY_ROUTES.map(n => (
            <PrefetchNavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => eliteNavLinkClass(isActive)}
            >
              {t(n.key)}
            </PrefetchNavLink>
          ))}
        </div>

        <div className="elite-desktop-nav__aside">
          {OVERFLOW_NAV_ROUTES.filter(n => n.to === '/compare').map(n => (
            <PrefetchNavLink
              key={n.to}
              to={n.to}
              title={t('nav.compareTooltip')}
              className={({ isActive }) => `${eliteNavLinkClass(isActive)} elite-nav-link--secondary`}
            >
              {t(n.key)}
            </PrefetchNavLink>
          ))}
          <PrefetchNavLink
            to={isLoggedIn ? '/dashboard' : '/register'}
            className={({ isActive }) =>
              `${eliteNavLinkClass(isActive)} elite-nav-link--account${isActive ? '' : ''}`
            }
          >
            {isLoggedIn ? t('nav.dashboard') : t('nav.register')}
          </PrefetchNavLink>
          <ApplyNavLink layout="cta" />
        </div>
      </div>
    </nav>
  )
}