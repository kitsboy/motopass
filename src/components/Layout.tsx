import { NavLink, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Logo } from './Logo'
import { Footer } from './Footer'
import { RouteSeo } from './RouteSeo'
import { HeaderToolbar } from './nav/HeaderToolbar'
import { DesktopNav } from './nav/DesktopNav'
import { MobileMenuSheet } from './nav/MobileMenuSheet'
import { MobileBottomNav } from './nav/MobileBottomNav'
import { MoreNavSheet } from './nav/MoreNavSheet'
import { Breadcrumbs } from './nav/Breadcrumbs'
import { useI18n } from '../i18n/I18nContext'
import { FOOTER_VERSION } from '../lib/buildInfo'
import { useScrollToTop } from '../hooks/useScrollToTop'

export function Layout() {
  useScrollToTop()
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = moreOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [moreOpen])

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <RouteSeo />
      <a href="#main-content" className="skip-link">
        {t('nav.skip')}
      </a>

      <header className="sticky top-0 z-50 border-b border-mp/80 bg-card/92 backdrop-blur-xl shadow-header nav-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-5">
          <div className="h-12 sm:h-[3.25rem] flex items-center justify-between gap-2">
            <NavLink
              to="/"
              className="flex items-center gap-2 min-w-0 group shrink-0"
              onClick={() => setMenuOpen(false)}
            >
              <Logo size="sm" />
              <div className="min-w-0 hidden sm:block leading-tight">
                <div className="font-display font-semibold tracking-tight text-[13px] sm:text-sm truncate text-ink group-hover:text-mp-btc-text transition-colors">
                  MOTOPASS
                </div>
                <div className="hidden md:block text-[10px] text-ink-muted truncate font-mono max-w-[14rem]">
                  {FOOTER_VERSION} · {t('tagline')}
                </div>
                <div className="md:hidden text-[10px] text-ink-muted truncate font-mono">{FOOTER_VERSION}</div>
              </div>
            </NavLink>

            <HeaderToolbar />

            <button
              type="button"
              className="lg:hidden nav-btn nav-btn-icon !h-9 !w-9 shrink-0"
              onClick={() => setMenuOpen(v => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t('nav.close') : t('nav.menu')}
            >
              {menuOpen ? <X size={20} strokeWidth={2.25} /> : <Menu size={20} strokeWidth={2.25} />}
            </button>
          </div>
        </div>

        <MobileMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />

        <DesktopNav />
      </header>

      <main id="main-content" className="flex-1 relative">
        <div className="px-4 sm:px-6 max-w-7xl mx-auto pt-3">
          <Breadcrumbs />
        </div>
        <Outlet />
      </main>

      <MoreNavSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <MobileBottomNav moreOpen={moreOpen} onMoreToggle={() => setMoreOpen(v => !v)} />

      <Footer />
    </div>
  )
}