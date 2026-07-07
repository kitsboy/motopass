import { NavLink, Outlet, Link } from 'react-router-dom'
import { ExternalLink, Menu, X, User } from 'lucide-react'
import { useState } from 'react'
import { BlockHeight } from './BlockHeight'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { NostrConnect } from './NostrConnect'
import { Logo } from './Logo'
import { Footer } from './Footer'
import { useI18n } from '../i18n/I18nContext'
import { useUser } from '../context/UserContext'
import { BUILD_LABEL } from '../lib/buildInfo'

const NAV = [
  { to: '/', key: 'nav.pitch' as const, end: true },
  { to: '/portfolio', key: 'nav.portfolio' as const },
  { to: '/programs', key: 'nav.programs' as const },
  { to: '/simulator', key: 'nav.simulator' as const },
  { to: '/compare', key: 'nav.compare' as const },
  { to: '/vault', key: 'nav.vault' as const },
  { to: '/blog', key: 'nav.blog' as const },
]

export function Layout() {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  const navClass = (isActive: boolean) =>
    isActive
      ? 'border-btc-orange text-mp-btc-text bg-btc-orange-soft font-medium'
      : 'border-transparent text-ink-muted hover:text-ink hover:bg-section/80'

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink pb-20 md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-mp-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink focus:shadow-card focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-btc-orange"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-mp bg-card/90 backdrop-blur-xl shadow-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 min-w-0 group" onClick={() => setMenuOpen(false)}>
              <Logo size="sm" />
              <div className="min-w-0 hidden sm:block">
                <div className="font-display font-semibold tracking-tight text-sm sm:text-base truncate text-ink group-hover:text-btc-orange transition-colors">
                  MOTOPASS
                </div>
                <div className="text-[11px] text-ink-muted -mt-0.5 truncate font-mono">{BUILD_LABEL} · {t('tagline')}</div>
              </div>
            </NavLink>

            <div className="hidden lg:flex items-center gap-3">
              <BlockHeight />
              <NostrConnect />
              <ThemeToggle compact />
              <LanguageSwitcher compact />
              {isLoggedIn ? (
                <Link to="/dashboard" className="chip-active text-xs flex items-center gap-1 !py-1.5">
                  <User size={12} /> Dashboard
                </Link>
              ) : (
                <Link to="/register" className="chip text-xs flex items-center gap-1 !border-nostr-violet/30 !text-nostr-violet hover:!bg-nostr-violet-soft">
                  Register
                </Link>
              )}
              <a
                href="/website/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="chip text-xs flex items-center gap-1 hover:!border-btc-orange/40"
              >
                <ExternalLink size={12} /> Demo
              </a>
            </div>

            <button type="button" className="lg:hidden p-2.5 rounded-mp-md text-ink-muted hover:bg-section" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {menuOpen && (
            <div className="lg:hidden pb-4 space-y-3 border-t border-mp pt-4">
              <div className="flex flex-wrap gap-2 justify-between">
                <BlockHeight />
                <NostrConnect />
              </div>
              <div className="flex flex-wrap gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <Link to={isLoggedIn ? '/dashboard' : '/register'} className="btn-primary w-full text-center text-sm py-2.5" onClick={() => setMenuOpen(false)}>
                {isLoggedIn ? 'Dashboard' : 'Register with Nostr'}
              </Link>
              <nav className="grid grid-cols-2 gap-2">
                {NAV.map(n => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `text-sm px-3 py-2.5 rounded-mp-md border text-center transition-colors ${isActive ? 'chip-active' : 'chip'}`}
                  >
                    {t(n.key)}
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>

        <nav className="hidden lg:block border-t border-mp/60 bg-card-muted/50">
          <div className="max-w-7xl mx-auto px-6 flex gap-0.5 overflow-x-auto">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `text-sm px-4 py-3 border-b-2 transition-colors whitespace-nowrap rounded-t-md ${navClass(isActive)}`}
              >
                {t(n.key)}
              </NavLink>
            ))}
            <NavLink
              to={isLoggedIn ? '/dashboard' : '/register'}
              className={({ isActive }) =>
                `text-sm px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-nostr-violet text-nostr-violet bg-nostr-violet-soft/50' : navClass(false)}`
              }
            >
              {isLoggedIn ? 'Dashboard' : 'Register'}
            </NavLink>
          </div>
        </nav>
      </header>

      <main id="main-content" className="flex-1 relative">
        <Outlet />
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-mp bg-card/95 backdrop-blur-xl shadow-header safe-bottom">
        <div className="grid grid-cols-4 gap-0.5 px-2 py-2">
          {[
            { to: '/', key: 'nav.pitch' as const, end: true },
            { to: '/portfolio', key: 'nav.portfolio' as const },
            { to: '/programs', key: 'nav.programs' as const },
            { to: isLoggedIn ? '/dashboard' : '/register', key: 'nav.dashboard' as const },
          ].map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={'end' in n ? n.end : false}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-[44px] text-[11px] py-2 rounded-mp-md transition-colors ${isActive ? 'text-mp-btc-text bg-btc-orange-soft font-semibold' : 'text-ink-muted'}`
              }
            >
              <span className="leading-tight text-center px-0.5">{isLoggedIn && n.key === 'nav.dashboard' ? 'Dash' : t(n.key)}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <Footer />
    </div>
  )
}