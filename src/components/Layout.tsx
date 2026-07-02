import { NavLink, Outlet } from 'react-router-dom'
import { ExternalLink, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { BlockHeight } from './BlockHeight'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NostrConnect } from './NostrConnect'
import { useI18n } from '../i18n/I18nContext'

const NAV = [
  { to: '/', key: 'nav.pitch' as const, end: true },
  { to: '/programs', key: 'nav.programs' as const },
  { to: '/blog', key: 'nav.blog' as const },
  { to: '/verify', key: 'nav.verify' as const },
  { to: '/agents', key: 'nav.agents' as const },
  { to: '/apply', key: 'nav.apply' as const },
]

export function Layout() {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-sovereign-black text-freedom-white pb-20 md:pb-0">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-sovereign-black/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
            <NavLink to="/" className="flex items-center gap-2 min-w-0" onClick={() => setMenuOpen(false)}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-btc-orange to-[#c46f0f] flex items-center justify-center text-black font-bold text-lg shrink-0">₿</div>
              <div className="min-w-0">
                <div className="font-semibold tracking-wide text-sm sm:text-lg truncate">MOTOPASS</div>
                <div className="text-[9px] sm:text-[10px] text-sovereign-silver -mt-0.5 truncate">BUILD-20260702-007 • {t('tagline')}</div>
              </div>
            </NavLink>

            <div className="hidden lg:flex items-center gap-3">
              <BlockHeight />
              <NostrConnect />
              <LanguageSwitcher compact />
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
              <nav className="grid grid-cols-2 gap-2">
                {NAV.map(n => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `text-sm px-3 py-2 rounded-xl border text-center ${isActive ? 'border-btc-orange text-btc-orange bg-btc-orange/10' : 'border-white/10 text-sovereign-silver'}`
                    }
                  >
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
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `text-sm px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-btc-orange text-btc-orange' : 'border-transparent text-sovereign-silver hover:text-white'}`
                }
              >
                {t(n.key)}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-sovereign-black/98 backdrop-blur-xl safe-bottom">
        <div className="grid grid-cols-6 gap-0.5 px-1 py-1.5">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center text-[9px] py-1.5 rounded-lg ${isActive ? 'text-btc-orange bg-btc-orange/10' : 'text-sovereign-silver'}`
              }
            >
              <span className="font-medium leading-tight text-center px-0.5">{t(n.key)}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <footer className="border-t border-white/10 py-8 text-xs text-sovereign-silver hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between gap-4">
          <p>{t('footer.truth')}</p>
          <div className="flex gap-4">
            <a href="https://satohash.io" target="_blank" rel="noopener noreferrer" className="hover:text-btc-orange">Satohash.io</a>
            <a href="https://github.com/kitsboy/motopass" target="_blank" rel="noopener noreferrer" className="hover:text-btc-orange">GitHub</a>
            <a href="/website/index.html" target="_blank" rel="noopener noreferrer" className="hover:text-btc-orange">Pristine Demo</a>
          </div>
        </div>
      </footer>
    </div>
  )
}