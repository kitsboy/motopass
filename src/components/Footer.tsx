import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { AgentCardKimi } from './AgentCardKimi'
import { useI18n } from '../i18n/I18nContext'
import { GiveABitLogoLink } from './footer/GiveABitLogoLink'
import { FooterActionBar } from './footer/FooterActionBar'
import { FooterApplyLink } from './footer/FooterApplyLink'
import { BUILD_LABEL, FOOTER_VERSION } from '../lib/buildInfo'
import { MAIN_NAV_ROUTES } from '../lib/navRoutes'
import type { TranslationKey } from '../i18n/translations'

const FOOTER_ACCOUNT: { to: string; key: TranslationKey }[] = [
  { to: '/register', key: 'nav.register' },
  { to: '/dashboard', key: 'nav.dashboard' },
]

const footerLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-mp-btc-text font-medium border-b border-btc-orange/35 pb-0.5'
    : 'text-ink-muted hover:text-mp-btc-text transition-colors duration-fast border-b border-transparent hover:border-btc-orange/30 pb-0.5'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="footer-glass relative z-[1] mt-auto safe-bottom mb-20 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Logo size="lg" />
              <div>
                <div className="font-display font-semibold text-xl tracking-tight text-ink">MOTOPASS</div>
                <div className="text-xs text-mp-btc-text font-mono tracking-wide">{t('tagline')}</div>
              </div>
            </div>
            <p className="font-body text-sm text-ink-secondary leading-relaxed max-w-md mb-6">
              {t('footer.descriptionBefore')}
              <a href="https://satohash.io" className="text-accent font-medium hover:underline" target="_blank" rel="noopener noreferrer">
                Satohash.io
              </a>
              {t('footer.descriptionAfter')}
            </p>
            <nav className="flex flex-wrap gap-x-4 gap-y-2.5 text-sm font-chrome" aria-label="Footer">
              {MAIN_NAV_ROUTES.map(l =>
                l.apply ? (
                  <FooterApplyLink key={l.to} />
                ) : (
                  <NavLink key={l.to} to={l.to} className={footerLinkClass}>
                    {t(l.key)}
                  </NavLink>
                ),
              )}
              {FOOTER_ACCOUNT.map(l => (
                <NavLink key={l.to} to={l.to} className={footerLinkClass}>
                  {t(l.key)}
                </NavLink>
              ))}
              <a
                href="https://github.com/kitsboy/motopass"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-muted hover:text-mp-btc-text transition-colors duration-fast"
              >
                {t('footer.github')}
              </a>
              <a
                href="/website/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-muted hover:text-mp-btc-text transition-colors duration-fast"
              >
                {t('footer.pristineDemo')}
              </a>
            </nav>
          </div>
          <AgentCardKimi />
        </div>

        <FooterActionBar />

        <div className="border-t border-mp/60 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] text-ink-muted font-mono">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <span className="leading-none">© 2026 MotoPass</span>
            <span className="text-mp-strong hidden sm:inline" aria-hidden>·</span>
            <GiveABitLogoLink />
            <span className="text-mp-strong" aria-hidden>·</span>
            <span
              className="leading-none font-semibold text-mp-btc-text shrink-0 px-1.5 py-0.5 rounded-chip border border-btc-orange/25 bg-btc-orange-soft/40"
              data-build-version
              title={BUILD_LABEL}
            >
              {FOOTER_VERSION}
            </span>
            <span className="text-mp-strong hidden sm:inline" aria-hidden>·</span>
            <span className="leading-none hidden md:inline max-w-[14rem] truncate opacity-80" title={BUILD_LABEL}>
              {BUILD_LABEL}
            </span>
          </div>
          <span className="opacity-75">{t('footer.truth')}</span>
        </div>
      </div>
    </footer>
  )
}