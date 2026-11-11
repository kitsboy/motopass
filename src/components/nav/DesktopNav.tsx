import { PrefetchNavLink } from './PrefetchNavLink'
import { ApplyNavLink } from './ApplyNavLink'
import { useI18n } from '../../i18n/I18nContext'
import { MAIN_NAV_ROUTES, eliteNavLinkClass } from '../../lib/navRoutes'

const PRIMARY_ROUTES = MAIN_NAV_ROUTES.filter(r => !r.apply)

export function DesktopNav() {
  const { t } = useI18n()

  return (
    <nav className="s2-nav-links" aria-label={t('nav.mainNavigation')}>
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
      {/* Apply is a plain outlined button, and says so when applications are closed. */}
      <span className="s2-nav-apply">
        <ApplyNavLink layout="cta" />
      </span>
    </nav>
  )
}
