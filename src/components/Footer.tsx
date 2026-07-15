import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { AgentCardKimi } from './AgentCardKimi'
import { useI18n } from '../i18n/I18nContext'
import { GiveABitLogoLink } from './footer/GiveABitLogoLink'
import { FooterVerifyLink } from './footer/FooterVerifyLink'
import { FooterActionBar } from './footer/FooterActionBar'
import { FooterApplyLink } from './footer/FooterApplyLink'
import { BUILD_LABEL, FOOTER_VERSION } from '../lib/buildInfo'
import { useLiveDeployHealth } from '../hooks/useLiveDeployHealth'
import { MAIN_NAV_ROUTES } from '../lib/navRoutes'
import type { TranslationKey } from '../i18n/translations'

const FOOTER_ACCOUNT: { to: string; key: TranslationKey }[] = [
  { to: '/register', key: 'nav.register' },
  { to: '/dashboard', key: 'nav.dashboard' },
]

const footerLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-mp-btc-text font-medium border-b border-btc-orange/40 pb-0.5'
    : 'text-ink-muted hover:text-mp-btc-text transition-colors duration-fast border-b border-transparent hover:border-btc-orange/30 pb-0.5'

export function Footer() {
  const { t } = useI18n()
  const liveHealth = useLiveDeployHealth()

  return (
    <footer className="footer-glass relative z-[1] mt-auto safe-bottom mb-20 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative">
        <div className="mb-10">
          <div className="club-divider mb-10" aria-hidden />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            <div>
              <div className="flex items-center gap-3.5 mb-6">
                <Logo size="lg" />
                <div>
                  <div className="font-display font-semibold text-xl tracking-tight text-ink">MOTOPASS</div>
                  <div className="text-xs text-mp-btc-text font-mono tracking-[0.14em] uppercase mt-0.5 opacity-90">
                    {t('tagline')}
                  </div>
                </div>
              </div>
              <p className="font-body text-sm text-ink-secondary leading-relaxed max-w-md mb-7">
                {t('footer.descriptionBefore')}
                <a
                  href="https://satohash.io"
                  className="text-accent font-medium hover:underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Satohash.io
                </a>
                {t('footer.descriptionAfter')}
              </p>
              <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-chrome" aria-label="Footer">
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
        </div>

        <FooterActionBar />

        <div className="club-divider mb-6" aria-hidden />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] text-ink-muted font-mono">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <span className="leading-none">© 2026 MotoPass</span>
            <span className="text-mp-strong hidden sm:inline opacity-50" aria-hidden>
              ·
            </span>
            <GiveABitLogoLink />
            <span className="text-mp-strong opacity-50" aria-hidden>
              ·
            </span>
            <span
              className="inline-flex items-center gap-1.5 leading-none font-semibold text-mp-btc-text shrink-0 px-2 py-0.5 rounded-lg border border-btc-orange/30 bg-btc-orange-soft/50 shadow-[0_0_12px_rgba(255,149,0,0.08)]"
              data-build-version
              title={
                liveHealth === 'synced'
                  ? `${BUILD_LABEL} · live deploy matches`
                  : BUILD_LABEL
              }
            >
              {liveHealth === 'synced' && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] shrink-0"
                  aria-hidden
                  data-live-deploy-synced
                />
              )}
              {FOOTER_VERSION}
            </span>
            <span className="text-mp-strong opacity-50" aria-hidden>
              ·
            </span>
            <FooterVerifyLink />
            <span className="text-mp-strong hidden sm:inline opacity-50" aria-hidden>
              ·
            </span>
            <span className="leading-none hidden md:inline max-w-[16rem] truncate opacity-70" title={BUILD_LABEL}>
              {BUILD_LABEL}
            </span>
          </div>
          <span className="opacity-70 tracking-wide">{t('footer.truth')}</span>
        </div>
      </div>
    </footer>
  )
}