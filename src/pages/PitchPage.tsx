import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Globe, Clock, Users, Sparkles } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { BlockHeight } from '../components/BlockHeight'
import { HeroMotionBackground } from '../components/ui/HeroMotionBackground'

const PITCH_VERSION = '2026-07-02 • BUILD-010'

export function PitchPage() {
  const { t } = useI18n()

  return (
    <div>
      <section className="relative overflow-hidden px-4 sm:px-6 pt-10 sm:pt-16 pb-14 sm:pb-20 min-h-[min(88vh,720px)] flex items-center">
        <HeroMotionBackground />
        <div className="relative max-w-7xl mx-auto w-full animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-btc-orange/25 text-btc-orange text-[10px] tracking-[0.18em] uppercase mb-5 shadow-card">
            <Shield size={12} /> {t('tagline')}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold tracking-tight leading-[0.95] mb-5 max-w-3xl text-ink">
            {t('pitch.hero')}
          </h1>
          <p className="text-base sm:text-lg text-ink-secondary max-w-xl mb-8 leading-relaxed">{t('pitch.sub')}</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link to="/programs" className="btn-primary text-base px-7 py-3">
              {t('pitch.cta')} <ArrowRight size={18} />
            </Link>
            <Link to="/apply" className="btn-secondary text-base px-7 py-3">
              {t('nav.apply')} <Zap size={16} />
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
            <BlockHeight />
            <span className="font-mono text-btc-orange/90">{t('pitch.evolve')}</span>
            <span className="font-mono bg-card-muted px-2 py-1 rounded-mp-sm border border-mp">{PITCH_VERSION}</span>
          </div>
        </div>
      </section>

      <section className="surface-band px-4 sm:px-6 py-12 sm:py-14">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            { icon: Globe, title: '50 jurisdictions', sub: 'CBI, RBI & Bitcoin-native pathways' },
            { icon: Shield, title: 'Satohash proofs', sub: 'OpenTimestamps on every material claim' },
            { icon: Zap, title: 'Nostr identity', sub: 'npub-native applications, no email' },
            { icon: Users, title: 'Liaison agents', sub: 'Country AI agents for real applicants' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="card-elevated group">
              <div className="w-10 h-10 rounded-mp-md bg-btc-orange-soft flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Icon size={20} className="text-btc-orange" />
              </div>
              <div className="font-semibold text-ink mb-1">{title}</div>
              <div className="text-sm text-ink-muted leading-relaxed">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-14 sm:py-16 max-w-7xl mx-auto">
        <div className="section-label mb-2 flex items-center gap-2">
          <Sparkles size={12} /> THE STACK
        </div>
        <h2 className="text-2xl sm:text-4xl font-display font-semibold mb-10 text-ink">Bitcoin rails for sovereign mobility</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="card-elevated md:col-span-2 border-l-4 border-l-btc-orange">
            <h3 className="font-display font-semibold text-lg text-btc-orange-deep mb-3">Satohash.io — Truth You Can Verify</h3>
            <p className="text-sm text-ink-secondary mb-5 leading-relaxed">
              MotoPass is a Give A Bit company product. Every program cost, legal extract, and passport application
              milestone anchors to Bitcoin via OpenTimestamps. Satohash makes proofs human-readable — one click to verify.
            </p>
            <Link to="/verify" className="text-sm font-medium text-btc-orange hover:text-btc-orange-deep inline-flex items-center gap-1">
              Verify now <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-elevated bg-nostr-violet-soft/40 border-nostr-violet/20">
            <h3 className="font-display font-semibold text-lg text-nostr-violet mb-3">Nostr-native</h3>
            <p className="text-sm text-ink-secondary mb-5 leading-relaxed">
              Connect your npub. Receive policy alerts. Match with jurisdiction liaison agents. Dual-proof with Bitcoin block hashes.
            </p>
            <Link to="/agents" className="text-sm font-medium text-nostr-violet hover:underline inline-flex items-center gap-1">
              Meet agents <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="surface-band px-4 sm:px-6 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="section-label mb-2 flex items-center gap-2">
              <Clock size={12} /> EVOLVING PITCH
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-4 text-ink">Updated every BUILD</h2>
            <p className="text-sm text-ink-secondary leading-relaxed">
              This pitch page evolves with the product. As we add countries, stamp proofs, deploy Nostr relays,
              and onboard passport office liaisons, this page reflects the live state — not a static deck.
            </p>
          </div>
          <div className="card-elevated bg-btc-orange-soft border-btc-orange/30">
            <div className="text-3xl font-display text-gradient-orange mb-4">Next</div>
            <ul className="text-sm text-ink-secondary space-y-2.5">
              <li className="flex gap-2"><span className="text-btc-orange">→</span> Lightning fee rails for premium stamping</li>
              <li className="flex gap-2"><span className="text-btc-orange">→</span> Live Nostr relay at relay.motopass.giveabit.io</li>
              <li className="flex gap-2"><span className="text-btc-orange">→</span> 25 → 50 countries at flagship depth</li>
              <li className="flex gap-2"><span className="text-btc-orange">→</span> Official liaison agent onboarding per jurisdiction</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}