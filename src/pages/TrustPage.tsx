import { useMemo, useState } from 'react'
import { ArrowLeftRight, ShieldCheck, BadgeCheck, RotateCcw } from 'lucide-react'
import { useTrustIndex, fetchCountryTrust } from '../lib/countryTrust'
import type { CountryTrustEnvelope } from '../types/countryTrust'
import { FreshnessRing } from '../components/trust/FreshnessRing'
import { ScorecardRadar } from '../components/trust/ScorecardRadar'
import { ProofBadge } from '../components/trust/ProofBadge'
import { ThresholdSparkline } from '../components/trust/ThresholdSparkline'
import { SourceTierStrip } from '../components/trust/SourceTierStrip'
import { PageHeader } from '../components/ui/PageHeader'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { SeoHead } from '../components/SeoHead'

/**
 * TrustPage — the live trust-card surface (route /trust).
 * Mobile-first: cards stack in one column; desktop is a responsive grid.
 * The grid renders from the lightweight index (zero per-country fetches),
 * and tapping a card loads the full envelope into a detail drawer.
 * A compare mode lets Cam overlay 2-4 countries' radar charts side by side.
 * All honesty visuals are central and data-driven — nothing is invented here.
 */
export function TrustPage() {
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
      setCompareNote('Compare holds up to 4 countries — remove one first.')
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

  const filterPills = [
    { id: 'all' as const, label: `All (${total})` },
    { id: 'fresh' as const, label: `Fresh (${sweep.fresh})` },
    { id: 'stale' as const, label: `Stale (${sweep.stale})` },
  ]

  return (
    <>
      <SeoHead
        title="Live Trust Cards — verify every country claim yourself"
        description="Every MotoPass country fact is traceable to a source and sealed into Bitcoin. Live freshness rings, proof badges, and interactive scorecards — honest staleness included."
        path="/trust"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Trust · honesty by design"
          title="Live Trust Cards"
          description="We would rather show you old truth than new lies. Every number below traces to a real source and is sealed into Bitcoin — and when a fact gets old, we show it as old, not pretend it's fresh."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-chip border border-mp-proof/35 bg-mp-proof-soft px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide text-mp-proof">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {sweep.fresh} fresh · {sweep.stale} stale
              </span>
              <button
                type="button"
                onClick={() => setShowCompare((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-chip border border-mp-btc/30 bg-mp-btc-soft px-2.5 py-1.5 font-chrome text-xs font-semibold text-mp-btc-text hover:border-mp-btc/50"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                Compare
              </button>
            </div>
          }
        />

        {/* honesty banner */}
        <div className="mb-6 rounded-mp-lg border border-mp-border-subtle bg-mp-section/60 px-4 py-3 font-body text-[13px] leading-relaxed text-mp-ink-secondary">
          <strong className="text-mp-ink">The honesty promise:</strong> a red ring means “we haven't
          re-confirmed in over 45 days” — it doesn't mean the fact is wrong. We never paint a stale
          fact green. Every “✓ Bitcoin-anchored” badge opens the real Satohash verification for that
          country's proof. Nothing here is invented at render time.
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

        {loading ? (
          <CardSkeleton count={6} />
        ) : error ? (
          <div className="rounded-mp-lg border border-mp-border bg-mp-card p-6 text-center font-body text-sm text-mp-ink-secondary">
            Trust envelopes unavailable right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c, i) => (
              <button
                key={c.iso2}
                type="button"
                onClick={() => openCountry(c.iso2)}
                className="group relative w-full overflow-hidden rounded-card border bg-mp-card p-5 text-left shadow-mp-1 transition-[box-shadow,border-color] duration-base hover:shadow-mp-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mp-btc"
                style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
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
                    label={`${c.name} freshness`}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {c.proof_status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1 rounded-chip border border-mp-proof/35 bg-mp-proof-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-mp-proof">
                      <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" /> Bitcoin-anchored
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-chip border border-mp-ochre/40 bg-mp-btc-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-mp-btc-text">
                      Proof pending
                    </span>
                  )}
                  {c.sovereignty_score != null && (
                    <span className="font-mono text-[10px] text-mp-ink-tertiary">
                      sovereignty {c.sovereignty_score}/10
                    </span>
                  )}
                  {c.min_investment_usd != null && (
                    <span className="ml-auto font-mono text-[11px] text-mp-ink-secondary">
                      ${c.min_investment_usd.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-1.5 border-t border-mp-border-subtle pt-3 font-body text-[11px] text-mp-ink-tertiary">
                  {c.freshness_status === 'fresh'
                    ? 'Verified recently and sealed into Bitcoin.'
                    : c.freshness_status === 'watch'
                      ? 'Getting old — flagged before it goes stale.'
                      : 'Over 45 days unconfirmed — shown honestly.'}
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-mp-btc-text opacity-0 transition-opacity group-hover:opacity-100">
                    details →
                  </span>
                </div>
              </button>
            ))}
          </div>
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
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ScorecardRadar scorecard={selected.scorecard} />
                <div className="space-y-3">
                  <ProofBadge proof={selected.proof} />
                  <ThresholdSparkline threshold={selected.threshold} />
                  <SourceTierStrip sources={selected.sources} />
                  <div className="rounded-mp-lg border border-mp-border-subtle bg-mp-section/60 p-3 font-body text-[12px] leading-relaxed text-mp-ink-secondary">
                    <span className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
                      Last audit trail
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
                Add to compare
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
                <h2 className="font-display text-xl text-mp-ink">Compare trust</h2>
                <button
                  type="button"
                  onClick={() => setShowCompare(false)}
                  className="rounded-full border border-mp-border p-1.5 text-mp-ink-tertiary hover:border-mp-border-strong hover:text-mp-ink"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <p className="mb-4 font-body text-[13px] text-mp-ink-secondary">
                Pick up to 4 countries from the grid to overlay their scorecards. Tap a card's
                ✓-proof row or “Add to compare” from a country's detail.
              </p>
              {compareNote && (
                <p className="mb-3 rounded-mp-lg border border-mp-ochre/40 bg-mp-btc-soft px-3 py-2 font-body text-[12px] text-mp-btc-text">
                  {compareNote}
                </p>
              )}

              {compare.length === 0 ? (
                <div className="rounded-mp-lg border border-dashed border-mp-border-strong/50 p-8 text-center font-body text-sm text-mp-ink-tertiary">
                  Nothing selected yet — open a country and choose “Add to compare”.
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
                          aria-label={`Remove ${env.country.name}`}
                        >
                          ✕
                        </button>
                      </div>
                      <ScorecardRadar scorecard={env.scorecard} />
                      <div className="mt-2">
                        <SourceTierStrip sources={env.sources} />
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
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Clear compare
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
