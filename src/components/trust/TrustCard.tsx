import { motion, useReducedMotion } from 'motion/react'
import { ChevronRight, Scale, ShieldCheck, Activity } from 'lucide-react'
import type { CountryTrustEnvelope } from '../../types/countryTrust'
import { FreshnessRing } from './FreshnessRing'
import { ProofBadge } from './ProofBadge'
import { ScorecardRadar } from './ScorecardRadar'
import { ThresholdSparkline } from './ThresholdSparkline'
import { SourceTierStrip } from './SourceTierStrip'

/**
 * TrustCard — the reusable 5-sub-component trust card, wired to the
 * gab.country-trust.v1 envelope. Mobile-first (single column, tap-to-open),
 * desktop gets a two-column layout. The honesty visuals (freshness ring, proof
 * badge, per-card footer) are central — never hidden, never fabricated.
 */
export function TrustCard({
  envelope,
  onOpen,
  index = 0,
}: {
  envelope: CountryTrustEnvelope
  onOpen?: (envelope: CountryTrustEnvelope) => void
  index?: number
}) {
  const reduceMotion = useReducedMotion()
  const { country, freshness, proof, sovereignty } = envelope

  const body = (
    <>
      {/* header: flag + name + freshness ring */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-3xl leading-none" aria-hidden="true">
            {country.flag ?? '🏳️'}
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-tight text-mp-ink">{country.name}</h3>
            <span className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
              {country.region ?? ''}
              {sovereignty.risk_level ? ` · ${sovereignty.risk_level} risk` : ''}
            </span>
          </div>
        </div>
        <FreshnessRing
          status={freshness.status}
          daysStale={freshness.days_stale}
          verifiedAt={freshness.verified_at}
          label={`${country.name} freshness`}
        />
      </div>

      {/* proof badge + sovereignty */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ProofBadge proof={proof} />
        {sovereignty.score != null && (
          <span
            className="inline-flex items-center gap-1 rounded-chip border border-mp-btc/25 bg-mp-btc-soft px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-mp-btc-text"
            title={`Sovereignty score ${sovereignty.score}/10`}
          >
            <ShieldCheck className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            sovereignty {sovereignty.score}/10
          </span>
        )}
      </div>

      {/* radar — always visible; the full trust card is used in detail/compare surfaces */}
      <div className="mt-4">
        <ScorecardRadar scorecard={envelope.scorecard} />
      </div>

      {/* threshold sparkline */}
      <div className="mt-4">
        <ThresholdSparkline threshold={envelope.threshold} />
      </div>

      {/* source tier strip */}
      <div className="mt-4">
        <SourceTierStrip sources={envelope.sources} />
      </div>

      {/* honesty footer — always visible */}
      <div className="mt-4 flex items-center gap-1.5 border-t border-mp-border-subtle pt-3 font-body text-[11px] text-mp-ink-tertiary">
        <Activity className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>
          {freshness.status === 'fresh'
            ? 'Verified recently and sealed into Bitcoin.'
            : freshness.status === 'watch'
              ? 'Getting old — flagged before it goes stale.'
              : 'Over 45 days unconfirmed — shown honestly, never hidden.'}
        </span>
        {onOpen && (
          <span className="ml-auto inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-wide text-mp-btc-text">
            details <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  )

  const cardClass =
    'group relative w-full overflow-hidden rounded-card border bg-mp-card p-5 text-left shadow-mp-1 transition-[box-shadow,border-color] duration-base hover:shadow-mp-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mp-btc'

  if (reduceMotion || !onOpen) {
    return (
      <button type="button" onClick={() => onOpen?.(envelope)} className={cardClass}>
        {body}
      </button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(envelope)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={cardClass}
    >
      {body}
    </motion.button>
  )
}

/** Compact variant for the compare drawer / Paige — radar always visible. */
export function TrustCardCompact({ envelope }: { envelope: CountryTrustEnvelope }) {
  const { country } = envelope
  return (
    <div className="rounded-card border border-mp-border bg-mp-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none" aria-hidden="true">
          {country.flag ?? '🏳️'}
        </span>
        <h4 className="font-display text-base text-mp-ink">{country.name}</h4>
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-mp-ink-tertiary">
          <Scale className="h-3 w-3" aria-hidden="true" /> trust
        </span>
      </div>
      <div className="mt-3">
        <ScorecardRadar scorecard={envelope.scorecard} />
      </div>
      <div className="mt-3">
        <SourceTierStrip sources={envelope.sources} />
      </div>
    </div>
  )
}
