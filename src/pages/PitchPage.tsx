import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Clock,
  Users,
  Sparkles,
  Bitcoin,
  Database,
  TrendingDown,
  ClipboardList,
  Layers,
  Radio,
  CheckCircle2,
  RefreshCw,
  Compass,
  ShieldCheck,
  BookOpen,
} from 'lucide-react'
import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useI18n } from '../i18n/I18nContext'
import { BlockHeight } from '../components/BlockHeight'
import { BtcPriceTicker } from '../components/BtcPriceTicker'
import { HeroMotionBackground } from '../components/pitch/HeroMotionBackground'
import { HeroCtaLink } from '../components/pitch/HeroCtaLink'
import { EvolvingPitchRotator } from '../components/pitch/EvolvingPitchRotator'
import { SavingsGraphs } from '../components/pitch/SavingsGraphs'
import { PitchRevealSection } from '../components/pitch/PitchRevealSection'
import { PitchTrustedStrip } from '../components/pitch/PitchTrustedStrip'
import { PitchRoadmapTimeline } from '../components/pitch/PitchRoadmapTimeline'
import { PitchFaqAccordion } from '../components/pitch/PitchFaqAccordion'
import { Card } from '../components/ui/Card'
import { HowItWorksSection } from '../components/ui/HowItWorksSection'
import { usePrograms } from '../hooks/usePrograms'
import { useLaunchGates } from '../hooks/useLaunchGates'
import {
  computePitchStats,
  pitchStatsToMetrics,
  pitchStatsToSavingsRows,
  latestProofTimestamp,
  formatUsd,
} from '../lib/pitchStats'
import { BUILD_ID, BUILD_DATE } from '../lib/buildInfo'
import { PageAnchorNav } from '../components/nav/PageAnchorNav'
import type { TranslationKey } from '../i18n/translations'

const PITCH_VERSION = `${BUILD_DATE} • ${BUILD_ID}`

const TAGLINE_KEYS = [
  'pitch.tagline1',
  'pitch.tagline2',
  'pitch.tagline3',
  'pitch.tagline4',
  'pitch.tagline5',
] as const

const FEATURE_KEYS = [
  { icon: Globe, titleKey: 'pitch.feature.jurisdictions.title' as const, subKey: 'pitch.feature.jurisdictions.sub' as const },
  { icon: Shield, titleKey: 'pitch.feature.satohash.title' as const, subKey: 'pitch.feature.satohash.sub' as const },
  { icon: Zap, titleKey: 'pitch.feature.nostr.title' as const, subKey: 'pitch.feature.nostr.sub' as const },
  { icon: Users, titleKey: 'pitch.feature.agents.title' as const, subKey: 'pitch.feature.agents.sub' as const },
]

/** Forge → Seal → Ledger → Nexus */
const PILLAR_KEYS = [
  { icon: TrendingDown, titleKey: 'pitch.pillar.forge.title' as const, subKey: 'pitch.pillar.forge.sub' as const, to: '/distressed', accent: 'btc' },
  { icon: Shield, titleKey: 'pitch.pillar.seal.title' as const, subKey: 'pitch.pillar.seal.sub' as const, to: '/vault', accent: 'btc' },
  { icon: Database, titleKey: 'pitch.pillar.ledger.title' as const, subKey: 'pitch.pillar.ledger.sub' as const, to: '/programs', accent: 'electric' },
  { icon: Radio, titleKey: 'pitch.pillar.nexus.title' as const, subKey: 'pitch.pillar.nexus.sub' as const, to: '/agents', accent: 'violet' },
] as const

const PRODUCT_KEYS = [
  { icon: Layers, titleKey: 'pitch.product.programs.title' as const, subKey: 'pitch.product.programs.sub' as const, to: '/programs' },
  { icon: Shield, titleKey: 'pitch.product.vault.title' as const, subKey: 'pitch.product.vault.sub' as const, to: '/vault' },
  { icon: TrendingDown, titleKey: 'pitch.product.distressed.title' as const, subKey: 'pitch.product.distressed.sub' as const, to: '/distressed' },
  { icon: ClipboardList, titleKey: 'pitch.product.apply.title' as const, subKey: 'pitch.product.apply.sub' as const, to: '/apply' },
] as const

const HOW_STEPS = [
  { n: '01', titleKey: 'pitch.how.step1.title' as const, bodyKey: 'pitch.how.step1.body' as const },
  { n: '02', titleKey: 'pitch.how.step2.title' as const, bodyKey: 'pitch.how.step2.body' as const },
  { n: '03', titleKey: 'pitch.how.step3.title' as const, bodyKey: 'pitch.how.step3.body' as const },
] as const

const LIVE_KEYS = [
  'pitch.live.programs',
  'pitch.live.btc',
  'pitch.live.proofs',
  'pitch.live.gates',
] as const

const GUIDE_STEPS = [
  { n: '01', titleKey: 'pitch.guide.step1.title' as const, bodyKey: 'pitch.guide.step1.body' as const, icon: Compass, to: '/programs' },
  { n: '02', titleKey: 'pitch.guide.step2.title' as const, bodyKey: 'pitch.guide.step2.body' as const, icon: ShieldCheck, to: '/vault' },
  { n: '03', titleKey: 'pitch.guide.step3.title' as const, bodyKey: 'pitch.guide.step3.body' as const, icon: BookOpen, to: '/portfolio' },
  { n: '04', titleKey: 'pitch.guide.step4.title' as const, bodyKey: 'pitch.guide.step4.body' as const, icon: Users, to: '/apply' },
] as const

const ROADMAP_LINKS: { key: TranslationKey; to: string }[] = [
  { key: 'pitch.roadmap.btcmap', to: '/btcmap' },
  { key: 'pitch.roadmap.lightning', to: '/programs?lightning=1' },
  { key: 'pitch.roadmap.relay', to: '/verify' },
  { key: 'pitch.roadmap.uruguay', to: '/programs?q=Uruguay' },
  { key: 'pitch.roadmap.agents', to: '/agents' },
]

export function PitchPage() {
  const { t } = useI18n()
  const { programs, loading } = usePrograms()
  const { report, applicationsOpen } = useLaunchGates()
  const stats = useMemo(() => (programs.length ? computePitchStats(programs) : null), [programs])
  const metrics = useMemo(() => (stats ? pitchStatsToMetrics(stats) : []), [stats])
  const savingsRows = useMemo(() => (stats ? pitchStatsToSavingsRows(stats) : []), [stats])
  const proofTs = useMemo(() => latestProofTimestamp(programs), [programs])
  const taglines = useMemo(() => TAGLINE_KEYS.map(k => t(k)), [t])
  const gatesPassed = report.gates.filter(g => g.pass).length

  const pitchAnchors = useMemo(
    () => [
      { id: 'pitch-hero', label: t('subnav.pitch.overview') },
      { id: 'pitch-savings', label: t('subnav.pitch.savings') },
      { id: 'pitch-guide', label: t('subnav.pitch.guide') },
      { id: 'pitch-pillars', label: t('subnav.pitch.pillars') },
      { id: 'pitch-products', label: t('subnav.pitch.products') },
      { id: 'pitch-how', label: t('subnav.pitch.how') },
      { id: 'pitch-faq', label: t('subnav.pitch.faq') },
      { id: 'pitch-cta', label: t('subnav.pitch.cta') },
    ],
    [t],
  )

  return (
    <div className="page-container bg-mp-canvas">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <PageAnchorNav items={pitchAnchors} />
      </div>

      {/* ── Hero ── */}
      <section id="pitch-hero" className="relative isolate overflow-hidden scroll-mt-header">
        <HeroMotionBackground />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 py-16 sm:py-28 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="hero-copy max-w-xl"
          >
            <span className="club-eyebrow text-mp-btc drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
              MEMBERS · {t('tagline')}
            </span>
            <h1 className="hero-headline mt-4 font-display text-hero">{t('pitch.hero')}</h1>
            <p className="mt-6 max-w-lg font-body text-lg2 text-mp-on-hero-secondary drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)] leading-relaxed">
              {t('pitch.sub')}
            </p>

            {stats && (
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-xl border border-white/15 bg-white/8 px-3 py-1.5 font-mono text-[11px] text-mp-on-hero-secondary backdrop-blur-sm">
                  {stats.programCount} jurisdictions
                </span>
                <span className="rounded-xl border border-btc-orange/35 bg-btc-orange/12 px-3 py-1.5 font-mono text-[11px] text-mp-btc drop-shadow-sm">
                  ~{formatUsd(stats.costSavingsUsd)} avg. advisory savings
                </span>
                {stats.lightningCount > 0 && (
                  <span className="rounded-xl border border-electric/30 bg-electric-soft/40 px-3 py-1.5 font-mono text-[11px] text-electric backdrop-blur-sm">
                    {stats.lightningCount} Lightning-ready
                  </span>
                )}
              </div>
            )}

            <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <HeroCtaLink to="/programs" variant="primary">
                {t('pitch.cta')} <ArrowRight size={18} />
              </HeroCtaLink>
              <HeroCtaLink to="/simulator" variant="secondary" className="border-white/20 text-mp-on-hero-secondary hover:text-mp-on-hero">
                {t('pitch.stackSimulator')} <Zap size={16} />
              </HeroCtaLink>
              <HeroCtaLink
                to="/btcmap"
                variant="secondary"
                className="border-btc-orange/30 bg-btc-orange/8 text-mp-on-hero hover:text-mp-btc-text"
              >
                {t('pitch.btcmapCta')} <Bitcoin size={16} />
              </HeroCtaLink>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-mp-on-hero-muted">
              <BlockHeight variant="hero" />
              <BtcPriceTicker variant="hero" />
              <span className="font-mono text-mp-btc/90 flex items-center gap-1">
                <RefreshCw size={11} /> {t('pitch.evolve')}
              </span>
              <span className="font-mono bg-white/10 px-2 py-1 rounded-lg border border-white/10">{PITCH_VERSION}</span>
            </div>
          </motion.div>

          {!loading && metrics.length > 0 && (
            <EvolvingPitchRotator metrics={metrics} taglines={taglines} proofTimestamp={proofTs} />
          )}
          {loading && (
            <div className="w-full max-w-md h-72 rounded-panel bg-mp-modal/50 animate-pulse skeleton-shimmer" aria-hidden />
          )}
        </div>
      </section>

      <PitchTrustedStrip programs={programs} loading={loading} />

      <SavingsGraphs rows={savingsRows} loading={loading} />

      {/* ── Site-wide guide ── */}
      <PitchRevealSection id="pitch-guide" stagger={0.04} className="surface-band px-4 sm:px-6 py-14 sm:py-16 scroll-mt-header">
        <div className="max-w-7xl mx-auto">
          <HowItWorksSection
            eyebrow={t('pitch.guide.eyebrow')}
            title={t('pitch.guide.title')}
            intro={t('pitch.guide.intro')}
            footerNote={t('pitch.guide.footer')}
            className="mb-0"
            steps={GUIDE_STEPS.map(step => ({
              n: step.n,
              title: t(step.titleKey),
              body: t(step.bodyKey),
              icon: step.icon,
              link: { to: step.to, label: t('pitch.guide.cta') },
            }))}
          />
        </div>
      </PitchRevealSection>

      {/* ── Four pillars ── */}
      <PitchRevealSection id="pitch-pillars" stagger={0.08} className="px-4 sm:px-6 py-14 sm:py-18 max-w-7xl mx-auto scroll-mt-header">
        <div className="mb-10 max-w-2xl">
          <span className="club-eyebrow block mb-3">{t('pitch.platform.eyebrow')}</span>
          <h2 className="font-display text-h2 font-semibold text-ink tracking-tight">{t('pitch.platform.title')}</h2>
          <p className="mt-3 font-body text-body text-ink-secondary leading-relaxed">{t('pitch.platform.sub')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLAR_KEYS.map(({ icon: Icon, titleKey, subKey, to, accent }, i) => (
            <Link key={titleKey} to={to} className="group">
              <Card variant="interactive" animate delay={0.04 + i * 0.04} className="h-full !p-5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${
                    accent === 'violet'
                      ? 'bg-nostr-violet-soft border border-nostr-violet/25 text-nostr-violet'
                      : accent === 'electric'
                        ? 'bg-electric-soft border border-electric/25 text-electric'
                        : 'bg-btc-orange-soft border border-btc-orange/25 text-btc-orange'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <h3 className="font-display font-semibold text-ink mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{t(subKey)}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-chrome font-medium text-mp-btc-text opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight size={12} />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </PitchRevealSection>

      {/* ── Platform products ── */}
      <PitchRevealSection id="pitch-products" stagger={0.12} className="surface-band px-4 sm:px-6 py-14 sm:py-16 scroll-mt-header">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="club-eyebrow block mb-3">{t('pitch.products.eyebrow')}</span>
              <h2 className="font-display text-h2 font-semibold text-ink">{t('pitch.products.title')}</h2>
            </div>
            {applicationsOpen && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-mp-proof/35 bg-mp-proof/10 px-3 py-1.5 font-mono text-[11px] text-mp-proof">
                <CheckCircle2 size={12} /> Applications open · {gatesPassed}/{report.gates.length} gates
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRODUCT_KEYS.map(({ icon: Icon, titleKey, subKey, to }, i) => (
              <Link key={titleKey} to={to} className="group">
                <Card variant="elevated" animate delay={0.03 + i * 0.03} className="h-full !p-5">
                  <Icon size={18} className="text-btc-orange mb-3" />
                  <h3 className="font-display font-semibold text-ink mb-1.5">{t(titleKey)}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{t(subKey)}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </PitchRevealSection>

      {/* ── How it works ── */}
      <PitchRevealSection id="pitch-how" stagger={0.16} className="px-4 sm:px-6 py-14 sm:py-16 max-w-7xl mx-auto scroll-mt-header">
        <span className="club-eyebrow block mb-3">{t('pitch.how.eyebrow')}</span>
        <h2 className="font-display text-h2 font-semibold text-ink mb-10">{t('pitch.how.title')}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {HOW_STEPS.map(({ n, titleKey, bodyKey }, i) => (
            <Card key={titleKey} animate delay={0.05 + i * 0.05} className="!p-6 relative overflow-hidden">
              <span className="absolute top-4 right-5 font-display text-5xl font-bold text-btc-orange/8 select-none">{n}</span>
              <h3 className="font-display font-semibold text-lg text-ink mb-3 relative">{t(titleKey)}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed relative">{t(bodyKey)}</p>
            </Card>
          ))}
        </div>
      </PitchRevealSection>

      {/* ── Feature grid ── */}
      <PitchRevealSection stagger={0.2} className="surface-band px-4 sm:px-6 py-12 sm:py-14">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {FEATURE_KEYS.map(({ icon: Icon, titleKey, subKey }) => (
            <Card key={titleKey} variant="elevated" className="group !p-5">
              <div className="w-10 h-10 rounded-2xl bg-btc-orange-soft border border-btc-orange/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Icon size={20} className="text-btc-orange" />
              </div>
              <div className="font-semibold text-ink mb-1">{t(titleKey)}</div>
              <div className="text-sm text-ink-muted leading-relaxed">{t(subKey)}</div>
            </Card>
          ))}
        </div>
      </PitchRevealSection>

      {/* ── Live data trust strip ── */}
      <PitchRevealSection stagger={0.24} className="px-4 sm:px-6 py-14 sm:py-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <span className="club-eyebrow block mb-3">{t('pitch.live.eyebrow')}</span>
            <h2 className="font-display text-h2 font-semibold text-ink mb-4">{t('pitch.live.title')}</h2>
            <ul className="space-y-3">
              {LIVE_KEYS.map(key => (
                <li key={key} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                  <CheckCircle2 size={14} className="text-mp-proof shrink-0 mt-0.5" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
          <Card variant="banner" className="!p-6">
            <div className="section-label mb-2 flex items-center gap-2">
              <Clock size={12} /> {t('pitch.evolve.eyebrow')}
            </div>
            <h3 className="font-display font-semibold text-lg text-ink mb-3">{t('pitch.evolve.title')}</h3>
            <p className="text-sm text-ink-secondary leading-relaxed mb-5">{t('pitch.evolve.body')}</p>
            <PitchRoadmapTimeline links={ROADMAP_LINKS} nextLabel={t('pitch.roadmap.next')} />
          </Card>
        </div>
      </PitchRevealSection>

      {/* ── Stack deep-dive ── */}
      <PitchRevealSection stagger={0.28} className="surface-band px-4 sm:px-6 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="section-label mb-2 flex items-center gap-2">
            <Sparkles size={12} /> {t('pitch.stack.eyebrow')}
          </div>
          <h2 className="text-2xl sm:text-4xl font-display font-semibold mb-10 text-ink">{t('pitch.stack.title')}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <Card variant="elevated" className="border-l-4 border-l-btc-orange !p-6">
              <h3 className="font-display font-semibold text-lg text-btc-orange-deep mb-3">{t('pitch.stack.satohash.title')}</h3>
              <p className="text-sm text-ink-secondary mb-5 leading-relaxed">{t('pitch.stack.satohash.body')}</p>
              <Link to="/vault" className="text-sm font-medium text-accent inline-flex items-center gap-1">
                {t('pitch.stack.satohash.cta')} <ArrowRight size={14} />
              </Link>
            </Card>
            <Card variant="elevated" className="bg-btc-orange-soft/20 border-btc-orange/20 !p-6">
              <h3 className="font-display font-semibold text-lg text-btc-orange mb-3">{t('pitch.stack.distressed.title')}</h3>
              <p className="text-sm text-ink-secondary mb-5 leading-relaxed">{t('pitch.stack.distressed.body')}</p>
              <Link to="/distressed" className="text-sm font-medium text-mp-btc-text hover:underline inline-flex items-center gap-1">
                {t('pitch.stack.distressed.cta')} <ArrowRight size={14} />
              </Link>
            </Card>
            <Card variant="elevated" className="bg-nostr-violet-soft/30 border-nostr-violet/20 !p-6">
              <h3 className="font-display font-semibold text-lg text-nostr-violet mb-3">{t('pitch.stack.nostr.title')}</h3>
              <p className="text-sm text-ink-secondary mb-5 leading-relaxed">{t('pitch.stack.nostr.body')}</p>
              <Link to="/agents" className="text-sm font-medium text-nostr-violet hover:underline inline-flex items-center gap-1">
                {t('pitch.stack.nostr.cta')} <ArrowRight size={14} />
              </Link>
            </Card>
          </div>
        </div>
      </PitchRevealSection>

      <PitchFaqAccordion eyebrow={t('pitch.faq.eyebrow')} title={t('pitch.faq.title')} />

      {/* ── CTA band ── */}
      <PitchRevealSection id="pitch-cta" stagger={0.32} className="px-4 sm:px-6 pb-16 sm:pb-20 max-w-7xl mx-auto scroll-mt-header">
        <Card variant="banner" animate className="!p-8 sm:!p-10 text-center">
          <h2 className="font-display text-h2 font-semibold text-ink mb-3">{t('pitch.ctaBand.title')}</h2>
          <p className="font-body text-body text-ink-secondary max-w-xl mx-auto mb-8 leading-relaxed">{t('pitch.ctaBand.sub')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/apply" className="btn-primary text-sm w-full sm:w-auto">
              {t('pitch.ctaBand.apply')} <ArrowRight size={16} />
            </Link>
            <Link to="/programs" className="btn-secondary text-sm w-full sm:w-auto">
              {t('pitch.ctaBand.explore')}
            </Link>
            <Link to="/vault" className="btn-secondary text-sm w-full sm:w-auto">
              {t('pitch.ctaBand.vault')} <Shield size={16} />
            </Link>
          </div>
        </Card>
      </PitchRevealSection>
    </div>
  )
}