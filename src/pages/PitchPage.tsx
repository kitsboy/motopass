import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Globe, Clock, Users, Sparkles, Bitcoin } from 'lucide-react'
import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useI18n } from '../i18n/I18nContext'
import { BlockHeight } from '../components/BlockHeight'
import { HeroMotionBackground } from '../components/pitch/HeroMotionBackground'
import { EvolvingPitchRotator } from '../components/pitch/EvolvingPitchRotator'
import { SavingsGraphs } from '../components/pitch/SavingsGraphs'
import { usePrograms } from '../hooks/usePrograms'
import {
  computePitchStats,
  pitchStatsToMetrics,
  pitchStatsToSavingsRows,
  latestProofTimestamp,
} from '../lib/pitchStats'
import { BUILD_ID, BUILD_DATE } from '../lib/buildInfo'

const PITCH_VERSION = `${BUILD_DATE} • ${BUILD_ID}`

const ROTATING_TAGLINES = [
  'Bitcoin is the speed.',
  'Bitcoin is the value.',
  'Bitcoin is the sovereignty.',
  'Verify every claim on-chain.',
  'Stack jurisdictions with proof.',
]

export function PitchPage() {
  const { t } = useI18n()
  const { programs, loading } = usePrograms()
  const stats = useMemo(() => (programs.length ? computePitchStats(programs) : null), [programs])
  const metrics = useMemo(() => (stats ? pitchStatsToMetrics(stats) : []), [stats])
  const savingsRows = useMemo(() => (stats ? pitchStatsToSavingsRows(stats) : []), [stats])
  const proofTs = useMemo(() => latestProofTimestamp(programs), [programs])

  return (
    <div className="bg-mp-canvas">
      <section className="relative isolate overflow-hidden">
        <HeroMotionBackground />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 py-16 sm:py-32 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="hero-copy max-w-xl"
          >
            <span className="font-mono text-eyebrow uppercase tracking-[0.2em] text-mp-btc drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
              {t('tagline')}
            </span>
            <h1 className="hero-headline mt-4 font-display text-hero">
              {t('pitch.hero')}
            </h1>
            <p className="mt-6 max-w-md font-body text-lg2 text-mp-on-hero-secondary drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)]">
              {t('pitch.sub')}
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to="/programs"
                className="inline-flex items-center gap-2 rounded-full bg-mp-btc px-7 py-3.5 font-chrome text-sm font-semibold text-mp-ink-on-accent shadow-mp-glow transition-transform duration-fast ease-spring-snappy hover:-translate-y-0.5"
              >
                {t('pitch.cta')} <ArrowRight size={18} />
              </Link>
              <Link
                to="/simulator"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-chrome text-sm text-mp-on-hero-secondary hover:border-mp-btc/40 hover:text-mp-on-hero transition-colors"
              >
                Stack simulator <Zap size={16} />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-mp-on-hero-muted">
              <BlockHeight variant="hero" />
              <span className="font-mono text-mp-btc/90 flex items-center gap-1">
                <Bitcoin size={12} /> {t('pitch.evolve')}
              </span>
              <span className="font-mono bg-white/10 px-2 py-1 rounded-chip border border-white/10">{PITCH_VERSION}</span>
            </div>
          </motion.div>

          {!loading && metrics.length > 0 && (
            <EvolvingPitchRotator metrics={metrics} taglines={ROTATING_TAGLINES} proofTimestamp={proofTs} />
          )}
          {loading && (
            <div className="w-full max-w-md h-64 rounded-panel bg-mp-modal/50 animate-pulse" aria-hidden />
          )}
        </div>
      </section>

      <SavingsGraphs rows={savingsRows} loading={loading} />

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
              Every program cost, legal extract, and passport milestone anchors to Bitcoin via OpenTimestamps.
              One click to verify — speed without sacrificing sovereignty.
            </p>
            <Link to="/verify" className="text-sm font-medium text-accent inline-flex items-center gap-1">
              Verify now <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-elevated bg-nostr-violet-soft/40 border-nostr-violet/20">
            <h3 className="font-display font-semibold text-lg text-nostr-violet mb-3">Nostr-native</h3>
            <p className="text-sm text-ink-secondary mb-5 leading-relaxed">
              Connect your npub. Policy alerts. Liaison agents. Dual-proof with Bitcoin block hashes.
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
            <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-4 text-ink">Charts update with every BUILD</h2>
            <p className="text-sm text-ink-secondary leading-relaxed">
              Cost and time savings are computed from live <code className="text-xs bg-section px-1 py-0.5 rounded">countries.json</code> data —
              not static investor deck numbers. As jurisdictions, Lightning readiness, and Satohash proofs grow, this page evolves automatically.
            </p>
          </div>
          <div className="card-elevated bg-btc-orange-soft border-btc-orange/30">
            <div className="text-3xl font-display text-gradient-orange mb-4">Next</div>
            <ul className="text-sm text-ink-secondary space-y-2.5">
              <li className="flex gap-2"><span className="text-mp-btc-text">→</span> Lightning fee rails for premium stamping</li>
              <li className="flex gap-2"><span className="text-mp-btc-text">→</span> Live Nostr relay at relay.motopass.giveabit.io</li>
              <li className="flex gap-2"><span className="text-mp-btc-text">→</span> Uruguay flagship depth across all 50 countries</li>
              <li className="flex gap-2"><span className="text-mp-btc-text">→</span> Official liaison agent onboarding per jurisdiction</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}