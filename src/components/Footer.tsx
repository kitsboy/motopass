import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { AgentCardKimi } from './AgentCardKimi'
import { useI18n } from '../i18n/I18nContext'
import { GiveABitLogoLink } from './footer/GiveABitLogoLink'
import { FooterActionBar } from './footer/FooterActionBar'
import { BUILD_LABEL } from '../lib/buildInfo'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-mp bg-card mt-auto shadow-[0_-4px_24px_rgba(24,24,27,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Logo size="lg" />
              <div>
                <div className="font-display font-semibold text-xl tracking-tight text-ink">MOTOPASS</div>
                <div className="text-xs text-btc-orange font-mono">{t('tagline')}</div>
              </div>
            </div>
            <p className="text-sm text-ink-secondary leading-relaxed max-w-md mb-6">
              Bitcoin-native sovereign passports and residency. Every claim verifiable on-chain via{' '}
              <a href="https://satohash.io" className="text-btc-orange font-medium hover:underline" target="_blank" rel="noopener noreferrer">
                Satohash.io
              </a>
              . Nostr identity. Not accepting applications yet.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {[
                { to: '/programs', label: 'Programs' },
                { to: '/blog', label: 'Insights' },
                { to: '/register', label: 'Register' },
                { to: '/dashboard', label: 'Dashboard' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="text-ink-muted hover:text-btc-orange transition-colors">
                  {l.label}
                </Link>
              ))}
              <a href="https://github.com/kitsboy/motopass" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-btc-orange transition-colors">
                GitHub
              </a>
              <a href="/website/index.html" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-btc-orange transition-colors">
                Pristine Demo
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
            <span className="leading-none">{BUILD_LABEL}</span>
          </div>
          <span>{t('footer.truth')}</span>
        </div>
      </div>
    </footer>
  )
}