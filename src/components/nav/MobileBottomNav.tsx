import { NavLink, useLocation } from 'react-router-dom'
import { BookOpen, Briefcase, Compass, LayoutGrid, MoreHorizontal } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import { useUser } from '../../context/UserContext'
import { MORE_PATHS } from '../../lib/navRoutes'

type Tab = {
  to: string
  labelKey: 'nav.pitch' | 'nav.programs' | 'nav.portfolio' | 'nav.dashboard'
  icon: typeof Compass
  end?: boolean
  registerFallback?: boolean
}

export function MobileBottomNav({ moreOpen, onMoreToggle }: { moreOpen: boolean; onMoreToggle: () => void }) {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()
  const location = useLocation()
  const moreActive = MORE_PATHS.some(
    p => location.pathname === p || (p === '/blog' && location.pathname.startsWith('/blog')),
  )

  const tabs: Tab[] = [
    { to: '/', labelKey: 'nav.pitch', icon: Compass, end: true },
    { to: '/programs', labelKey: 'nav.programs', icon: LayoutGrid },
    { to: '/portfolio', labelKey: 'nav.portfolio', icon: Briefcase },
    { to: isLoggedIn ? '/dashboard' : '/register', labelKey: 'nav.dashboard', icon: BookOpen, registerFallback: !isLoggedIn },
  ]

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-mp/80 bg-card/96 backdrop-blur-xl shadow-[0_-8px_32px_rgba(24,24,27,0.08)] safe-bottom"
      aria-label="Mobile tab bar"
    >
      <div className="grid grid-cols-5 gap-0 px-1 pt-1 pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" aria-hidden="true" />
                  <span className="leading-none truncate max-w-full px-0.5 text-[10px]">
                    {tab.registerFallback ? t('nav.register') : t(tab.labelKey === 'nav.dashboard' ? 'nav.dashboardShort' : tab.labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
        <button
          type="button"
          onClick={onMoreToggle}
          className={`nav-tab ${moreActive || moreOpen ? 'nav-tab-active' : ''}`}
          aria-expanded={moreOpen}
          aria-label={t('nav.more')}
        >
          <MoreHorizontal size={17} strokeWidth={moreActive || moreOpen ? 2.5 : 2} aria-hidden="true" />
          <span className="leading-none text-[10px]">{t('nav.more')}</span>
        </button>
      </div>
    </nav>
  )
}