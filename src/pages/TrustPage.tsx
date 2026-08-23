import { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeftRight, ShieldCheck, BadgeCheck, RotateCcw } from 'lucide-react'
import { useTrustIndex, fetchCountryTrust } from '../lib/countryTrust'
import type { CountryTrustEnvelope } from '../types/countryTrust'
import { FreshnessRing } from '../components/trust/FreshnessRing'
import { BtcDualPrice } from '../components/BtcDualPrice'
import { PageHeader } from '../components/ui/PageHeader'
import { SeoHead } from '../components/SeoHead'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'

// Drawer-only charts (radar, sparkline, source tiers, proof badge) are code-split
// and loaded ONLY when a card is tapped or compare is opened — they never touch the
// initial grid paint. FreshnessRing + BtcDualPrice stay eager (used on every card).
const ScorecardRadar = lazy(() =>
  import('../components/trust/ScorecardRadar').then((m) => ({ default: m.ScorecardRadar })),
)
const ProofBadge = lazy(() =>
  import('../components/trust/ProofBadge').then((m) => ({ default: m.ProofBadge })),
)
const ThresholdSparkline = lazy(() =>
  import('../components/trust/ThresholdSparkline').then((m) => ({ default: m.ThresholdSparkline })),
)
const SourceTierStrip = lazy(() =>
  import('../components/trust/SourceTierStrip').then((m) => ({ default: m.SourceTierStrip })),
)

/** Small Suspense fallback for the drawer charts. */
const ChartSuspense = ({ children }: { children: ReactNode }) => (
  <Suspense
    fallback={
      <div className="rounded-mp-lg border border-mp-border-subtle bg-mp-section/50 p-6 text-center font-body text-xs text-mp-ink-tertiary">
        Loading chart…
      </div>
    }
  >
    {children}
  </Suspense>
)

/**
 * TrustPage — the live trust-card surface (route /trust).
 * Mobile-first: cards stack in one column; desktop is a responsive grid.
 * The grid renders from the lightweight index (zero per-country fetches),
 * and tapping a card loads the full envelope into a detail drawer.
 * A compare mode lets Cam overlay 2-4 countries' radar charts side by side.
 * All honesty visuals are central and data-driven — nothing is invented here.
 */
export function TrustPage() {
  const { t } = useI18n()
  const { index, loading, error } = useTrustIndex()
  const [selected, setSelected] = useState<CountryTrustEnvelope | null>(null)
  const [compare, setCompare] = useState<CountryTrustEnvelope[]>([])
  const [filter, setFilter] = useState<'all' | 'fresh' | 'stale'>('all')
  const [showCompare, setShowCompare] = useState(false)
  const [compareNote, setCompareNote] = useState<string | null>(null)

  const sweep = index?.sweep ?? { fresh: 0, watch: 0, stale: 0 }
  const total = index?.count ?? 0

  const openCountry = async (iso2: string) => {
    const env = await fetchCountryTrust(iso2)
    if (env) setSelected(env)
  }

  const toggleCompare = async (iso2: string) => {
    if (compare.some((c) => c.country.iso2 === iso2)) {
      setCompare((c) => c.filter((x) => x.country.iso2 !== iso2))
      setCompareNote(null)
      return
    }
    if (compare.length >= 4) {
      setCompareNote(t('trust.compareMax'))
      return
    }
    const env = await fetchCountryTrust(iso2)
    if (env) {
      setCompare((c) => [...c, env])
      setCompareNote(null)
    }
  }

  const countries = useMemo(() => {
    if (!index) return []
    const list = [...index.countries]
    if (filter === 'fresh') return list.filter((c) => c.freshness_status === 'fresh')
    if (filter === 'stale') return list.filter((c) => c.freshness_status === 'stale')
    return list
  }, [index, filter])

  // ADV10B: lazy-load the 50-card grid. Only the first batch mounts at first paint;
  // an IntersectionObserver sentinel appends the rest in batches as the user scrolls.
  // Below-fold cards never shift visible content, so this is CLS-safe (unlike a fixed
  // skeleton or content-visibility, both measured and rejected). Resets on filter change.
  const INITIAL_BATCH = 8
  const STEP = 8
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH)
  }, [filter, index])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || visibleCount >= countries.length) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + STEP, countries.length))
        }
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [visibleCount, countries.length])

  const visibleCountries = useMemo(() => countries.slice(0, visibleCount), [countries, visibleCount])

  const filterPills = [
    { id: 'all' as const, label: formatT(t, 'trust.filterAll', { total }) },
    { id: 'fresh' as const, label: formatT(t, 'trust.filterFresh', { count: sweep.fresh }) },
    { id: 'stale' as const, label: formatT(t, 'trust.filterStale', { count: sweep.stale }) },
  ]

  return (
    <>
      <SeoHead
        title={t('trust.title')}
        description={t('trust.sub')}
        path="/trust"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow={t('trust.eyebrow')}
          title={t('trust.title')}
          description={t('trust.sub')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-chip border border-mp-proof/35 bg-mp-proof-soft px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide text-mp-proof">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {formatT(t, 'trust.sweepFresh', { fresh: sweep.fresh, stale: sweep.stale })}
              </span>
              <button
                type="button"
                onClick={() => setShowCompare((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-chip border border-mp-btc/30 bg-mp-btc-soft px-2.5 py-1.5 font-chrome text-xs font-semibold text-mp-btc-text hover:border-mp-btc/50"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                {t('trust.compare')}
              </button>
            </div>
          }
        />

        {/* honesty banner */}
        <div className="mb-6 rounded-mp-lg border border-mp-border-subtle bg-mp-section/60 px-4 py-3 font-body text-[13px] leading-relaxed text-mp-ink-secondary">
          <strong className="text-mp-ink">{t('trust.promise')}</strong> {t('trust.promiseBody')}
        </div>

        {/* filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {filterPills.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFilter(p.id)}
              className={`rounded-chip border px-3 py-1.5 font-chrome text-xs transition-colors ${
                filter === p.id
                  ? 'border-mp-btc/40 bg-mp-btc-soft text-mp-btc-text'
                  : 'border-mp-border text-mp-ink-secondary hover:border-mp-border-strong'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-mp-lg border border-mp-border bg-mp-card p-6 text-center font-body text-sm text-mp-ink-secondary">
            {t('trust.error')}
          </div>
        ) : loading ? (
          /* Lightweight loading state — NOT a 50-card skeleton grid. Inserting a
             15,000px-tall skeleton AFTER first paint caused a ~1.0 CLS (Core Web Vital)
             in ~50% of slow loads (async two-phase insert). A compact spinner avoids
             the massive off-screen insertion; the real grid mounts in one pass when
             the index arrives. */
          <div
            role="status"
            aria-busy="true"
            aria-label={t('trust.loading')}
            className="flex items-center justify-center gap-3 rounded-mp-lg border border-mp-border-subtle bg-mp-card px-4 py-10 font-body text-sm text-mp-ink-secondary"
          >
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-mp-btc/30 border-t-mp-btc" aria-hidden="true" />
            {t('trust.loading')}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCountries.map((c, i) => (
              <button
                key={c.iso2}
                    type="button"
                    onClick={() => openCountry(c.iso2)}
                    className="group relative flex min-h-[297px] w-full flex-col overflow-hidden rounded-card border bg-mp-card p-5 text-left shadow-mp-1 transition-[box-shadow,border-color] duration-base hover:shadow-mp-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mp-btc trust-card-surface"
                    style={{
                      animationDelay: `${Math.min(i, 6) * 50}ms`,
                    }}
                    title={`${c.name} — ${c.freshness_status === 'fresh' ? t('trust.cardFresh') : c.freshness_status === 'watch' ? t('trust.cardWatch') : t('trust.cardStale')}${c.sovereignty_score != null ? ` · ${formatT(t, 'trust.sovereignty', { score: c.sovereignty_score })}` : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-3xl leading-none" aria-hidden="true">
                          {c.flag ?? '🏳️'}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display text-lg leading-tight text-mp-ink">{c.name}</h3>
                          <span className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
                            {c.iso2}
                          </span>
                        </div>
                      </div>
                      <FreshnessRing
                        status={c.freshness_status}
                        daysStale={c.days_stale}
                        verifiedAt={null}
                        label={formatT(t, 'trust.freshnessLabel', { name: c.name })}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {c.proof_status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 rounded-chip border border-mp-proof/35 bg-mp-proof-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-mp-proof">
                          <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" /> {t('trust.bitcoinAnchored')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-chip border border-mp-ochre/40 bg-mp-btc-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-mp-btc-text">
                          {t('trust.proofPending')}
                        </span>
                      )}
                      {c.sovereignty_score != null && (
                        <span className="font-mono text-[10px] text-mp-ink-tertiary">
                          {formatT(t, 'trust.sovereignty', { score: c.sovereignty_score })}
                        </span>
                      )}
                    </div>

                    {c.min_investment_usd != null && (
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-mp-lg border border-mp-border-subtle bg-mp-section/50 px-3 py-2">
                        <span className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
                          {t('trust.minInvest')}
                        </span>
                        <BtcDualPrice usd={c.min_investment_usd} size="sm" layout="stack" className="items-end" />
                      </div>
                    )}

                    <div className="mt-auto flex items-center gap-1.5 border-t border-mp-border-subtle pt-3 font-body text-[11px] text-mp-ink-tertiary">
                      {c.freshness_status === 'fresh'
                        ? t('trust.cardFresh')
                        : c.freshness_status === 'watch'
                          ? t('trust.cardWatch')
                          : t('trust.cardStale')}
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-mp-btc-text opacity-0 transition-opacity group-hover:opacity-100">
                        {t('trust.details')} →
                      </span>
                    </div>
                  </button>
                ))}
          </div>
          {/* Lazy-load sentinel — observed to append the next batch of trust cards. */}
          {visibleCount < countries.length && (
            <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
          )}
          </>
        )}

        {/* detail drawer */}
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
            onClick={() => setSelected(null)}
          >
            <div
              className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-mp-lg bg-mp-card p-5 shadow-mp-4 sm:rounded-mp-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {selected.country.flag ?? '🏳️'}
                  </span>
                  <div>
                    <h2 className="font-display text-xl text-mp-ink">{selected.country.name}</h2>
                    <span className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary">
                      {selected.country.region ?? ''} · {selected.country.iso2}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full border border-mp-border p-1.5 text-mp-ink-tertiary hover:border-mp-border-strong hover:text-mp-ink"
                  aria-label={t('nav.close')}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ChartSuspense>
                  <ScorecardRadar scorecard={selected.scorecard} />
                </ChartSuspense>
                <div className="space-y-3">
                  <ChartSuspense>
                    <ProofBadge proof={selected.proof} />
                  </ChartSuspense>
                  <ChartSuspense>
                    <ThresholdSparkline threshold={selected.threshold} />
                  </ChartSuspense>
                  <ChartSuspense>
                    <SourceTierStrip sources={selected.sources} />
                  </ChartSuspense>
                  <div className="rounded-mp-lg border border-mp-border-subtle bg-mp-section/60 p-3 font-body text-[12px] leading-relaxed text-mp-ink-secondary">
                    <span className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
                      {t('trust.auditTrail')}
                    </span>
                    <ul className="mt-1.5 space-y-1">
                      {selected.audit_trail.slice(-4).map((e, i) => (
                        <li key={i}>
                          <span className="font-mono text-[10px] text-mp-ink-tertiary">
                            {e.date ?? '—'}
                          </span>{' '}
                          <span className="text-mp-ink">{e.field}</span> — {e.to ?? ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {selected.scorecard.note && (
                <div className="mt-4 rounded-mp-lg border border-mp-border-subtle bg-mp-section/60 p-3 font-body text-[12px] leading-relaxed text-mp-ink-secondary">
                  {selected.scorecard.note}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  toggleCompare(selected.country.iso2)
                  setSelected(null)
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-mp-lg border border-mp-btc/35 bg-mp-btc-soft px-4 py-2.5 font-chrome text-sm font-semibold text-mp-btc-text hover:border-mp-btc/55"
              >
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                {t('trust.addToCompare')}
              </button>
            </div>
          </div>
        )}

        {/* compare drawer */}
        {showCompare && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
            onClick={() => setShowCompare(false)}
          >
            <div
              className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-t-mp-lg bg-mp-card p-5 shadow-mp-4 sm:rounded-mp-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-mp-ink">{t('trust.compareTitle')}</h2>
                <button
                  type="button"
                  onClick={() => setShowCompare(false)}
                  className="rounded-full border border-mp-border p-1.5 text-mp-ink-tertiary hover:border-mp-border-strong hover:text-mp-ink"
                  aria-label={t('nav.close')}
                >
                  ✕
                </button>
              </div>

              <p className="mb-4 font-body text-[13px] text-mp-ink-secondary">
                {t('trust.compareHint')}
              </p>
              {compareNote && (
                <p className="mb-3 rounded-mp-lg border border-mp-ochre/40 bg-mp-btc-soft px-3 py-2 font-body text-[12px] text-mp-btc-text">
                  {compareNote}
                </p>
              )}

              {compare.length === 0 ? (
                <div className="rounded-mp-lg border border-dashed border-mp-border-strong/50 p-8 text-center font-body text-sm text-mp-ink-tertiary">
                  {t('trust.compareEmpty')}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {compare.map((env) => (
                    <div
                      key={env.country.iso2}
                      className="rounded-mp-lg border border-mp-border bg-mp-card p-4"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xl" aria-hidden="true">
                          {env.country.flag ?? '🏳️'}
                        </span>
                        <h3 className="font-display text-base text-mp-ink">{env.country.name}</h3>
                        <button
                          type="button"
                          onClick={() => toggleCompare(env.country.iso2)}
                          className="ml-auto rounded-full border border-mp-border p-1 text-mp-ink-tertiary hover:text-mp-ink"
                          aria-label={formatT(t, 'trust.removeCountry', { name: env.country.name })}
                        >
                          ✕
                        </button>
                      </div>
                      <ChartSuspense>
                        <ScorecardRadar scorecard={env.scorecard} />
                      </ChartSuspense>
                      <div className="mt-2">
                        <ChartSuspense>
                          <SourceTierStrip sources={env.sources} />
                        </ChartSuspense>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setCompare([])
                  setCompareNote(null)
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-mp-lg border border-mp-border px-4 py-2 font-chrome text-xs text-mp-ink-secondary hover:border-mp-border-strong hover:text-mp-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> {t('trust.clearCompare')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
