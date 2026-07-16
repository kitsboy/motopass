import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Logo } from './Logo'
import { Footer } from './Footer'
import { Header } from './Header'
import { RouteSeo } from './RouteSeo'
import { HeaderToolbar } from './nav/HeaderToolbar'
import { DesktopNav } from './nav/DesktopNav'
import { MobileMenuSheet } from './nav/MobileMenuSheet'
import { MobileBottomNav } from './nav/MobileBottomNav'
import { MoreNavSheet } from './nav/MoreNavSheet'
import { Breadcrumbs } from './nav/Breadcrumbs'
import { PageTransition } from './nav/PageTransition'
import { NavShortcutsModal } from './nav/NavShortcutsModal'
import { useI18n } from '../i18n/I18nContext'
import { FOOTER_VERSION } from '../lib/buildInfo'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { useHeaderCollapse } from '../hooks/useHeaderCollapse'
import { useLanguageShortcut } from '../hooks/useLanguageShortcut'
import { useNavShortcuts } from '../hooks/useNavShortcuts'
import { useGoToNavShortcuts } from '../hooks/useGoToNavShortcuts'
import { useRouteLangMemory } from '../hooks/useRouteLangMemory'
import { BackToTop } from './nav/BackToTop'

export function Layout() {
  useScrollToTop()
  useLanguageShortcut()
  useGoToNavShortcuts()
  useRouteLangMemory()
  const { shortcutsOpen, setShortcutsOpen } = useNavShortcuts()
  const { t } = useI18n()
  const headerCollapsed = useHeaderCollapse()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = moreOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [moreOpen])

  useEffect(() => {
    document.documentElement.classList.toggle('mp-header-collapsed', headerCollapsed)
    return () => {
      document.documentElement.classList.remove('mp-header-collapsed')
    }
  }, [headerCollapsed])

  return (
    <div className="sovereign-canvas flex flex-col bg-canvas text-ink w-full max-w-[100vw] overflow-x-clip overflow-y-clip">
      <div className="sovereign-ambient" aria-hidden />
      <div className="sovereign-glow" aria-hidden />
      <RouteSeo />
      <a href="#main-content" className="skip-link">
        {t('nav.skip')}
      </a>

      <Header collapsed={headerCollapsed}>
        <div className="relative z-30 max-w-7xl mx-auto px-3 sm:px-5 club-header-top-row">
          <div className="club-header-top-inner flex items-center justify-between gap-2">
            <NavLink
              to="/"
              className="flex items-center gap-2.5 min-w-0 group shrink-0"
              onClick={() => setMenuOpen(false)}
            >
              <Logo size="sm" />
              <div className="min-w-0 hidden sm:block leading-tight">
                <div className="font-display font-semibold tracking-tight text-[13px] sm:text-sm truncate text-ink group-hover:text-mp-btc-text transition-colors duration-fast">
                  MOTOPASS
                </div>
                <div className="club-header-tagline hidden md:block text-[10px] text-ink-muted truncate font-mono max-w-[14rem] opacity-80">
                  {FOOTER_VERSION} · {t('tagline')}
                </div>
                <div className="club-header-tagline club-header-build-tag hidden text-[10px] text-ink-muted truncate font-mono opacity-80">{FOOTER_VERSION}</div>
              </div>
            </NavLink>

            <HeaderToolbar collapsed={headerCollapsed} />

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
      </Header>

      <main
        id="main-content"
        className="layout-main relative z-[1] w-full min-w-0 max-w-full overflow-x-clip"
      >
        <div className="px-4 sm:px-6 max-w-7xl mx-auto pt-3 w-full min-w-0">
          <Breadcrumbs />
        </div>
        <PageTransition />
      </main>

      <NavShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <MoreNavSheet open={moreOpen} onClose={() => setMoreOpen(false)} />

      <BackToTop />
      <Footer />
      <MobileBottomNav moreOpen={moreOpen} onMoreToggle={() => setMoreOpen(v => !v)} />
    </div>
  )
}