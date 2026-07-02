import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { AgentCardKimi } from './AgentCardKimi'
import { useI18n } from '../i18n/I18nContext'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-white/10 bg-sovereign-black mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Logo size="lg" />
              <div>
                <div className="font-display font-semibold text-xl tracking-tight">MOTOPASS</div>
                <div className="text-xs text-btc-orange font-mono">{t('tagline')}</div>
              </div>
            </div>
            <p className="text-sm text-sovereign-silver leading-relaxed max-w-md mb-6">
              Bitcoin-native sovereign passports and residency. Every claim verifiable on-chain via{' '}
              <a href="https://satohash.io" className="text-btc-orange hover:underline" target="_blank" rel="noopener noreferrer">Satohash.io</a>.
              Nostr identity. No email required.
            </p>
            <div className="flex flex-wrap gap-4 text-xs">
              <Link to="/programs" className="text-sovereign-silver hover:text-btc-orange">Programs</Link>
              <Link to="/blog" className="text-sovereign-silver hover:text-btc-orange">Insights</Link>
              <Link to="/register" className="text-sovereign-silver hover:text-btc-orange">Register</Link>
              <Link to="/dashboard" className="text-sovereign-silver hover:text-btc-orange">Dashboard</Link>
              <a href="https://github.com/kitsboy/motopass" target="_blank" rel="noopener noreferrer" className="text-sovereign-silver hover:text-btc-orange">GitHub</a>
              <a href="/website/index.html" target="_blank" rel="noopener noreferrer" className="text-sovereign-silver hover:text-btc-orange">Pristine Demo</a>
            </div>
          </div>
          <AgentCardKimi />
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between gap-4 text-[10px] text-sovereign-silver font-mono">
          <span>© 2026 MotoPass • Give A Bit • BUILD-20260702-008</span>
          <span>{t('footer.truth')}</span>
        </div>
      </div>
    </footer>
  )
}