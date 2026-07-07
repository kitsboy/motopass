import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { ExternalLink, Menu, X, User, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BlockHeight } from './BlockHeight'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { NostrConnect } from './NostrConnect'
import { Logo } from './Logo'
import { Footer } from './Footer'
import { useI18n } from '../i18n/I18nContext'
import { useUser } from '../context/UserContext'
import { BUILD_LABEL } from '../lib/buildInfo'
import { RouteSeo } from './RouteSeo'

const NAV = [
  { to: '/', key: 'nav.pitch' as const, end: true },
  { to: '/portfolio', key: 'nav.portfolio' as const },
  { to: '/programs', key: 'nav.programs' as const },
  { to: '/simulator', key: 'nav.simulator' as const },
  { to: '/compare', key: 'nav.compare' as const },
  { to: '/vault', key: 'nav.vault' as const },
  { to: '/verify', key: 'nav.verify' as const },
  { to: '/blog', key: 'nav.blog' as const },
  { to: '/agents', key: 'nav.agents' as const },
]

const MORE_ROUTES = [
  { to: '/verify', key: 'nav.verify' as const },
  { to: '/blog', key: 'nav.blog' as const },
  { to: '/agents', key: 'nav.agents' as const },
  { to: '/simulator', key: 'nav.simulator' as const },
  { to: '/compare', key: 'nav.compare' as const },
  { to: '/vault', key: 'nav.vault' as const },
]

export function Layout() {
  const { t } = useI18n()
  const { isLoggedIn } = useUser()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = MORE_ROUTES.some(r => location.pathname === r.to || (r.to === '/blog' && location.pathname.startsWith('/blog')))

  const navClass = (isActive: boolean) =>
    isActive
      ? 'border-btc-orange text-mp-btc-text bg-btc-orange-soft font-medium'
      : 'border-transparent text-ink-muted hover:text-ink hover:bg-section/80'

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <RouteSeo />
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

      <AnimatePresence>
        {moreOpen && (
          <div className="lg:hidden fixed inset-0 z-[60]">
            <motion.button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="More navigation"
              className="absolute inset-x-0 bottom-0 bg-card border-t border-mp rounded-t-mp-xl shadow-card-hover safe-bottom"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-mp/60">
                <span className="font-display font-semibold text-sm text-ink">More</span>
                <button type="button" onClick={() => setMoreOpen(false)} className="p-2 rounded-mp-md text-ink-muted hover:bg-section" aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              <nav className="grid grid-cols-2 gap-2 p-4 pb-6">
                {MORE_ROUTES.map(n => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) => `text-sm px-3 py-3 rounded-mp-md border text-center transition-colors ${isActive ? 'chip-active' : 'chip'}`}
                  >
                    {t(n.key)}
                  </NavLink>
                ))}
                <NavLink
                  to={isLoggedIn ? '/dashboard' : '/register'}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) => `text-sm px-3 py-3 rounded-mp-md border text-center transition-colors col-span-2 ${isActive ? 'chip-active' : 'chip'}`}
                >
                  {isLoggedIn ? t('nav.dashboard') : 'Register'}
                </NavLink>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-mp bg-card/95 backdrop-blur-xl shadow-header safe-bottom">
        <div className="grid grid-cols-5 gap-0.5 px-1 py-2">
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
                `flex flex-col items-center justify-center min-h-[44px] text-[10px] py-1.5 rounded-mp-md transition-colors ${isActive ? 'text-mp-btc-text bg-btc-orange-soft font-semibold' : 'text-ink-muted'}`
              }
            >
              <span className="leading-tight text-center px-0.5">{isLoggedIn && n.key === 'nav.dashboard' ? t('nav.dashboardShort') : t(n.key)}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(v => !v)}
            className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] py-1.5 rounded-mp-md transition-colors ${moreActive || moreOpen ? 'text-mp-btc-text bg-btc-orange-soft font-semibold' : 'text-ink-muted'}`}
            aria-expanded={moreOpen}
            aria-label="More navigation"
          >
            <MoreHorizontal size={18} className="mb-0.5" />
            <span className="leading-tight">More</span>
          </button>
        </div>
      </nav>

      <Footer />
    </div>
  )
}