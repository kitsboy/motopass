import { NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import { MOBILE_TAB_ROUTES, MORE_PATHS, navTabClass } from '../../lib/navRoutes'
import { ApplyNavTab } from './ApplyNavLink'

export function MobileBottomNav({ moreOpen, onMoreToggle }: { moreOpen: boolean; onMoreToggle: () => void }) {
  const { t } = useI18n()
  const location = useLocation()
  const moreActive = MORE_PATHS.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`))

  return (
    <nav className="mobile-nav-glass lg:hidden fixed bottom-0 inset-x-0 z-50 safe-bottom" aria-label="Mobile tab bar">
      <div className="grid grid-cols-5 gap-0 px-1 pt-1 pb-1">
        {MOBILE_TAB_ROUTES.map(tab => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => navTabClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" aria-hidden="true" />
                  <span className="leading-none truncate max-w-full px-0.5 text-[10px] font-chrome">
                    {t(tab.key)}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
        <ApplyNavTab />
        <button
          type="button"
          onClick={onMoreToggle}
          className={navTabClass(moreActive || moreOpen)}
          aria-expanded={moreOpen}
          aria-label={t('nav.more')}
        >
          <MoreHorizontal size={17} strokeWidth={moreActive || moreOpen ? 2.5 : 2} aria-hidden="true" />
          <span className="leading-none text-[10px] font-chrome">{t('nav.more')}</span>
        </button>
      </div>
    </nav>
  )
}