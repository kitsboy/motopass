import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Globe, Clock, Users } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { BlockHeight } from '../components/BlockHeight'

const PITCH_VERSION = '2026-07-02 • BUILD-007'

export function PitchPage() {
  const { t } = useI18n()

  return (
    <div>
      <section className="relative overflow-hidden px-4 sm:px-6 pt-8 sm:pt-14 pb-12">
        <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-sovereign-black/40 via-sovereign-black/80 to-sovereign-black" />
        <div className="relative max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-btc-orange/10 text-btc-orange text-[10px] tracking-[0.2em] uppercase mb-4">
            <Shield size={12} /> {t('tagline')}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold tracking-tight leading-[0.95] mb-4 max-w-2xl">
            {t('pitch.hero')}
          </h1>
          <p className="text-base sm:text-lg text-sovereign-silver max-w-xl mb-6">{t('pitch.sub')}</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Link to="/programs" className="btn-primary inline-flex items-center justify-center gap-2">
              {t('pitch.cta')} <ArrowRight size={16} />
            </Link>
            <Link to="/apply" className="btn-secondary inline-flex items-center justify-center gap-2">
              {t('nav.apply')} <Zap size={15} />
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-sovereign-silver">
            <BlockHeight />
            <span className="font-mono text-btc-orange/70">{t('pitch.evolve')}</span>
            <span className="font-mono">{PITCH_VERSION}</span>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-sovereign-void px-4 sm:px-6 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Globe, title: '50 jurisdictions', sub: 'CBI, RBI & Bitcoin-native pathways' },
            { icon: Shield, title: 'Satohash proofs', sub: 'OpenTimestamps on every material claim' },
            { icon: Zap, title: 'Nostr identity', sub: 'npub-native applications, no email' },
            { icon: Users, title: 'Liaison agents', sub: 'Country AI agents for real applicants' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="card">
              <Icon size={20} className="text-btc-orange mb-3" />
              <div className="font-semibold text-sm mb-1">{title}</div>
              <div className="text-xs text-sovereign-silver">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-12 max-w-7xl mx-auto">
        <div className="section-label mb-2">THE STACK</div>
        <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-8">Bitcoin rails for sovereign mobility</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card md:col-span-2">
            <h3 className="font-semibold text-btc-orange mb-2">Satohash.io — Truth You Can Verify</h3>
            <p className="text-sm text-sovereign-silver mb-4">
              MotoPass is a Give A Bit company product. Every program cost, legal extract, and passport application
              milestone anchors to Bitcoin via OpenTimestamps. Satohash makes proofs human-readable — one click to verify.
            </p>
            <Link to="/verify" className="text-sm text-btc-orange hover:underline inline-flex items-center gap-1">
              Verify now <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card">
            <h3 className="font-semibold text-purple-300 mb-2">Nostr-native</h3>
            <p className="text-sm text-sovereign-silver mb-4">
              Connect your npub. Receive policy alerts. Match with jurisdiction liaison agents. Dual-proof with Bitcoin block hashes.
            </p>
            <Link to="/agents" className="text-sm text-purple-300 hover:underline inline-flex items-center gap-1">
              Meet agents <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-12 border-t border-white/10 bg-sovereign-void/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="section-label mb-2 flex items-center gap-2"><Clock size={12} /> EVOLVING PITCH</div>
            <h2 className="text-2xl font-display font-semibold mb-4">Updated every BUILD</h2>
            <p className="text-sm text-sovereign-silver leading-relaxed">
              This pitch page evolves with the product. As we add countries, stamp proofs, deploy Nostr relays,
              and onboard passport office liaisons, this page reflects the live state — not a static deck.
            </p>
          </div>
          <div className="card bg-btc-orange/5 border-btc-orange/30">
            <div className="text-3xl font-display text-btc-orange mb-2">Next</div>
            <ul className="text-sm text-sovereign-silver space-y-2">
              <li>• Lightning fee rails for premium stamping</li>
              <li>• Live Nostr relay at relay.motopass.giveabit.io</li>
              <li>• 25 → 50 countries at flagship depth</li>
              <li>• Official liaison agent onboarding per jurisdiction</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}