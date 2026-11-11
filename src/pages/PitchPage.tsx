import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, FileCheck2, Radar, ShieldCheck, RefreshCw } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import { PitchRevealSection } from '../components/pitch/PitchRevealSection'
import { PitchTrustedStrip } from '../components/pitch/PitchTrustedStrip'
import { Card } from '../components/ui/Card'
import { IntelWatchStrip } from '../components/intel/IntelWatchStrip'
import { usePrograms } from '../hooks/usePrograms'
import { useLaunchGates } from '../hooks/useLaunchGates'
import { computePitchStats } from '../lib/pitchStats'
import { Stage2Hero } from '../components/pitch/Stage2Hero'

/**

 * Home — five sections, in the order a visitor asks the questions.
 *
 *   1. What is this?      hero: one headline, one subline, one primary button
 *   2. Why trust it?      official sources, Bitcoin timestamps, honest staleness
 *   3. How does it work?  compare → model → register interest
 *   4. What's inside?     the real records
 *   5. What next?         one call to action and the honest application status
 *
 * Everything that answered none of those five questions is gone: the invented
 * savings comparison, the Forge/Seal/Ledger/Nexus codenames, the "trusted by
 * operators" strip, and four competing product grids. Numbers are rendered,
 * never animated up from zero — the count-up left the desktop first screen
 * reading "0 jurisdictions".
 */
export function PitchPage() {
  const { t } = useI18n()
  const { programs, loading } = usePrograms()
  const { applicationsOpen } = useLaunchGates()

  const stats = useMemo(() => (programs.length ? computePitchStats(programs) : null), [programs])
  const count = stats?.programCount ?? 0

  return (
    <div className="page-container bg-mp-canvas">
      {/* ── 1. What is this? ── */}
      <Stage2Hero programs={programs} loading={loading} />

      {/* ── 2. Why trust it ── */}
      <PitchRevealSection
        id="pitch-trust"
        stagger={0.04}
        className="surface-band px-4 sm:px-6 py-14 sm:py-16 scroll-mt-header"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 max-w-2xl">
            <span className="club-eyebrow block mb-3">{t('pitch.trust.eyebrow')}</span>
            <h2 className="font-display text-h2 font-semibold text-ink tracking-tight">{t('pitch.trust.title')}</h2>
            <p className="mt-3 font-body text-body text-ink-secondary leading-relaxed">{t('pitch.trust.sub')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/proof?tab=sources" className="block">
              <Card variant="interactive" className="h-full !p-6">
                <Radar size={20} className="text-btc-orange mb-4" aria-hidden />
                <h3 className="font-display font-semibold text-ink mb-2">{t('pitch.trust.sources.title')}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{t('pitch.trust.sources.body')}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-chrome text-mp-btc-text">
                  {t('pitch.trust.sources.cta')} <ArrowRight size={12} />
                </span>
              </Card>
            </Link>
            <Link to="/proof?tab=vault" className="block">
              <Card variant="interactive" className="h-full !p-6">
                <ShieldCheck size={20} className="text-mp-proof mb-4" aria-hidden />
                <h3 className="font-display font-semibold text-ink mb-2">{t('pitch.trust.stamps.title')}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{t('pitch.trust.stamps.body')}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-chrome text-mp-btc-text">
                  {t('pitch.trust.stamps.cta')} <ArrowRight size={12} />
                </span>
              </Card>
            </Link>
            <Link to="/proof?tab=trust" className="block">
              <Card variant="interactive" className="h-full !p-6">
                <FileCheck2 size={20} className="text-electric mb-4" aria-hidden />
                <h3 className="font-display font-semibold text-ink mb-2">{t('pitch.trust.stale.title')}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{t('pitch.trust.stale.body')}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-chrome text-mp-btc-text">
                  {t('pitch.trust.stale.cta')} <ArrowRight size={12} />
                </span>
              </Card>
            </Link>
          </div>

          <div className="mt-8">
            <IntelWatchStrip variant="ticker" />
          </div>
        </div>
      </PitchRevealSection>

      {/* ── 3. How it works — three plain steps ── */}
      <PitchRevealSection
        id="pitch-how"
        stagger={0.06}
        className="px-4 sm:px-6 py-14 sm:py-16 max-w-7xl mx-auto scroll-mt-header"
      >
        <span className="club-eyebrow block mb-3">{t('pitch.steps.eyebrow')}</span>
        <h2 className="font-display text-h2 font-semibold text-ink mb-10">{t('pitch.steps.title')}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {(['compare', 'model', 'apply'] as const).map((id, i) => (
            <Card key={id} className="!p-6 relative overflow-hidden">
              <span
                className="absolute top-4 right-5 font-display text-5xl font-bold text-btc-orange/8 select-none"
                aria-hidden
              >
                {i + 1}
              </span>
              <h3 className="font-display font-semibold text-lg text-ink mb-3 relative">{t(`pitch.steps.${id}.title`)}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed relative">{t(`pitch.steps.${id}.body`)}</p>
              <Link
                to={id === 'compare' ? '/programs' : id === 'model' ? '/simulator' : '/apply'}
                className="mt-4 inline-flex items-center gap-1 text-xs font-chrome text-mp-btc-text"
              >
                {t(`pitch.steps.${id}.cta`)} <ArrowRight size={12} />
              </Link>
            </Card>
          ))}
        </div>
      </PitchRevealSection>

      {/* ── 4. What's inside — the real records ── */}
      <PitchRevealSection
        id="pitch-browse"
        stagger={0.08}
        className="surface-band px-4 sm:px-6 py-12 sm:py-14 scroll-mt-header"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="club-eyebrow block mb-3">{t('pitch.browse.eyebrow')}</span>
              <h2 className="font-display text-h2 font-semibold text-ink">
                {stats ? formatT(t, 'pitch.browse.title', { count }) : t('pitch.browse.titlePending')}
              </h2>
            </div>
            <Link
              to="/programs"
              className="btn-secondary text-sm inline-flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              {stats ? formatT(t, 'pitch.browse.cta', { count }) : t('pitch.browse.ctaPending')} <ArrowRight size={14} />
            </Link>
          </div>
          <PitchTrustedStrip programs={programs} loading={loading} />
        </div>
      </PitchRevealSection>

      {/* ── 5. What next ── */}
      <PitchRevealSection
        id="pitch-start"
        stagger={0.1}
        className="px-4 sm:px-6 pb-16 sm:pb-20 pt-14 max-w-7xl mx-auto scroll-mt-header"
      >
        <Card variant="banner" className="!p-8 sm:!p-10">
          <div className="max-w-2xl">
            <h2 className="font-display text-h2 font-semibold text-ink mb-3">{t('pitch.start.title')}</h2>
            <p className="font-body text-body text-ink-secondary leading-relaxed mb-5">{t('pitch.start.body')}</p>
            <p className="mb-7 inline-flex items-start gap-2 rounded-xl border border-status-amber/30 bg-status-amber/10 px-3 py-2 text-sm text-ink-secondary">
              <Clock size={14} className="text-status-amber shrink-0 mt-0.5" aria-hidden />
              {applicationsOpen ? t('pitch.start.open') : t('pitch.start.closed')}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link to="/programs" className="btn-primary text-sm inline-flex items-center justify-center gap-2">
                {stats ? formatT(t, 'pitch.cta', { count }) : t('pitch.ctaPending')} <ArrowRight size={16} />
              </Link>
              <Link to="/apply" className="btn-secondary text-sm inline-flex items-center justify-center gap-2">
                {t('pitch.start.applyCta')}
              </Link>
              <Link to="/proof" className="btn-secondary text-sm inline-flex items-center justify-center gap-2">
                <RefreshCw size={14} aria-hidden /> {t('pitch.verifyCta')}
              </Link>
            </div>
          </div>
        </Card>
      </PitchRevealSection>
    </div>
  )
}
