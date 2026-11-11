import { PrefetchNavLink } from './PrefetchNavLink'
import { ApplyNavLink } from './ApplyNavLink'
import { useI18n } from '../../i18n/I18nContext'
import { MAIN_NAV_ROUTES, eliteNavLinkClass } from '../../lib/navRoutes'

const PRIMARY_ROUTES = MAIN_NAV_ROUTES.filter(r => !r.apply)

export function DesktopNav() {
  const { t } = useI18n()

  return (
    <nav className="elite-desktop-nav" aria-label={t('nav.mainNavigation')}>
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

        {/* Account links moved into the Settings menu; the bar carries the
            five product routes and Apply, nothing else. */}
        <div className="elite-desktop-nav__aside">
          <ApplyNavLink layout="cta" />
        </div>
      </div>
    </nav>
  )
}
