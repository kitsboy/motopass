import { NavLink, Outlet, Link } from 'react-router-dom'
import { ExternalLink, Menu, X, User } from 'lucide-react'
import { useState } from 'react'
import { BlockHeight } from './BlockHeight'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NostrConnect } from './NostrConnect'
import { Logo } from './Logo'
import { Footer } from './Footer'
import { useI18n } from '../i18n/I18nContext'
import { useUser } from '../context/UserContext'

const NAV = [
  { to: '/', key: 'nav.pitch' as const, end: true },
  { to: '/programs', key: 'nav.programs' as const },
  { to: '/blog', key: 'nav.blog' as const },
  { to: '/verify', key: 'nav.verify' as const },
  { to: '/apply', key: 'nav.apply' as const },
]

export function Layout() {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-sovereign-black text-freedom-white pb-20 md:pb-0">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-sovereign-black/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 min-w-0" onClick={() => setMenuOpen(false)}>
              <Logo size="sm" />
              <div className="min-w-0 hidden xs:block">
                <div className="font-semibold tracking-wide text-sm sm:text-base truncate">MOTOPASS</div>
                <div className="text-[9px] text-sovereign-silver -mt-0.5 truncate">BUILD-008 • {t('tagline')}</div>
              </div>
            </NavLink>

            <div className="hidden lg:flex items-center gap-3">
              <BlockHeight />
              <NostrConnect />
              <LanguageSwitcher compact />
              {isLoggedIn ? (
                <Link to="/dashboard" className="text-xs flex items-center gap-1 text-btc-orange border border-btc-orange/40 rounded-full px-3 py-1.5">
                  <User size={12} /> Dashboard
                </Link>
              ) : (
                <Link to="/register" className="text-xs flex items-center gap-1 text-purple-300 border border-purple-500/40 rounded-full px-3 py-1.5 hover:bg-purple-500/10">
                  Register
                </Link>
              )}
              <a href="/website/index.html" target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-sovereign-silver hover:text-btc-orange border border-white/15 rounded-full px-3 py-1.5">
                <ExternalLink size={12} /> Demo
              </a>
            </div>

            <button type="button" className="lg:hidden p-2 text-sovereign-silver" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {menuOpen && (
            <div className="lg:hidden pb-4 space-y-3 border-t border-white/10 pt-3">
              <div className="flex flex-wrap gap-2 justify-between">
                <BlockHeight />
                <NostrConnect />
              </div>
              <LanguageSwitcher />
              <Link to={isLoggedIn ? '/dashboard' : '/register'} className="btn-primary w-full text-center text-sm py-2" onClick={() => setMenuOpen(false)}>
                {isLoggedIn ? 'Dashboard' : 'Register with Nostr'}
              </Link>
              <nav className="grid grid-cols-2 gap-2">
                {NAV.map(n => (
                  <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `text-sm px-3 py-2 rounded-xl border text-center ${isActive ? 'border-btc-orange text-btc-orange bg-btc-orange/10' : 'border-white/10 text-sovereign-silver'}`}>
                    {t(n.key)}
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>

        <nav className="hidden lg:block border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `text-sm px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-btc-orange text-btc-orange' : 'border-transparent text-sovereign-silver hover:text-white'}`}>
                {t(n.key)}
              </NavLink>
            ))}
            <NavLink to={isLoggedIn ? '/dashboard' : '/register'}
              className={({ isActive }) => `text-sm px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-purple-400 text-purple-300' : 'border-transparent text-sovereign-silver hover:text-white'}`}>
              {isLoggedIn ? 'Dashboard' : 'Register'}
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-sovereign-black/98 backdrop-blur-xl safe-bottom">
        <div className="grid grid-cols-5 gap-0.5 px-1 py-1.5">
          {NAV.slice(0, 4).map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `flex flex-col items-center justify-center text-[9px] py-1.5 rounded-lg ${isActive ? 'text-btc-orange bg-btc-orange/10' : 'text-sovereign-silver'}`}>
              <span className="font-medium leading-tight text-center px-0.5">{t(n.key)}</span>
            </NavLink>
          ))}
          <NavLink to={isLoggedIn ? '/dashboard' : '/register'}
            className={({ isActive }) => `flex flex-col items-center justify-center text-[9px] py-1.5 rounded-lg ${isActive ? 'text-purple-300 bg-purple-500/10' : 'text-sovereign-silver'}`}>
            <User size={14} className="mb-0.5" />
            <span>{isLoggedIn ? 'Dash' : 'Join'}</span>
          </NavLink>
        </div>
      </nav>

      <Footer />
    </div>
  )
}