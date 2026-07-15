import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { AgentCardKimi } from './AgentCardKimi'
import { useI18n } from '../i18n/I18nContext'
import { GiveABitLogoLink } from './footer/GiveABitLogoLink'
import { FooterActionBar } from './footer/FooterActionBar'
import { BUILD_LABEL, FOOTER_VERSION } from '../lib/buildInfo'
import type { TranslationKey } from '../i18n/translations'

const FOOTER_LINKS: { to: string; key: TranslationKey }[] = [
  { to: '/programs', key: 'nav.programs' },
  { to: '/agents', key: 'nav.agents' },
  { to: '/blog', key: 'nav.blog' },
  { to: '/register', key: 'nav.register' },
  { to: '/dashboard', key: 'nav.dashboard' },
]

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-mp bg-card mt-auto shadow-[0_-4px_24px_rgba(24,24,27,0.04)] safe-bottom mb-20 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Logo size="lg" />
              <div>
                <div className="font-display font-semibold text-xl tracking-tight text-ink">MOTOPASS</div>
                <div className="text-xs text-mp-btc-text font-mono">{t('tagline')}</div>
              </div>
            </div>
            <p className="text-sm text-ink-secondary leading-relaxed max-w-md mb-6">
              {t('footer.descriptionBefore')}
              <a href="https://satohash.io" className="text-accent font-medium hover:underline" target="_blank" rel="noopener noreferrer">
                Satohash.io
              </a>
              {t('footer.descriptionAfter')}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {FOOTER_LINKS.map(l => (
                <Link key={l.to} to={l.to} className="text-ink-muted hover:text-btc-orange transition-colors">
                  {t(l.key)}
                </Link>
              ))}
              <a href="https://github.com/kitsboy/motopass" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-btc-orange transition-colors">
                {t('footer.github')}
              </a>
              <a href="/website/index.html" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-btc-orange transition-colors">
                {t('footer.pristineDemo')}
              </a>
            </div>
          </div>
          <AgentCardKimi />
        </div>

        <FooterActionBar />

        <div className="border-t border-mp pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] text-ink-muted font-mono">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <span className="leading-none">© 2026 MotoPass</span>
            <span className="text-mp-strong hidden sm:inline" aria-hidden>·</span>
            <GiveABitLogoLink />
            <span className="text-mp-strong" aria-hidden>·</span>
            <span
              className="leading-none font-semibold text-mp-btc-text shrink-0"
              data-build-version
              title={BUILD_LABEL}
            >
              {FOOTER_VERSION}
            </span>
            <span className="text-mp-strong hidden sm:inline" aria-hidden>·</span>
            <span className="leading-none hidden sm:inline">{BUILD_LABEL}</span>
          </div>
          <span>{t('footer.truth')}</span>
        </div>
      </div>
    </footer>
  )
}