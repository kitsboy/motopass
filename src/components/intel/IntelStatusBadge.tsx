import { Radio } from 'lucide-react'
import { useIntel } from '../../hooks/useIntel'

interface IntelStatusBadgeProps {
  programName: string
  compact?: boolean
}

const STYLES: Record<string, string> = {
  watch: 'border-mp-ochre/50 bg-mp-btc-soft text-mp-btc-text',
  stale: 'border-mp-border-strong bg-mp-section text-mp-ink-tertiary',
  resync: 'border-mp-wax/40 bg-mp-wax/10 text-mp-wax',
}

/**
 * Honest Country Intel badge — driven by the daily intel.json manifest
 * (freshness sweep + source probe + proof re-stamp state). Renders nothing
 * when the manifest is missing or the program is fresh + in sync, so it never
 * invents a state.
 */
export function IntelStatusBadge({ programName, compact = false }: IntelStatusBadgeProps) {
  const { intel } = useIntel()
  const entry = intel?.programs?.[programName]
  if (!entry) return null

  const { freshness, watch, proof } = entry

  if (watch.changed) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-chip border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${STYLES.watch}`}
        role="status"
        title="Official source content changed — rule review flagged"
      >
        <Radio className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
        {compact ? 'Watch' : 'Watch · source changed'}
      </span>
    )
  }

  if (!proof.in_sync) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-chip border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${STYLES.resync}`}
        role="status"
        title="On-chain proof is re-anchoring — converges on the next daily sweep"
      >
        {compact ? 'Resync' : 'Proof re-anchoring'}
      </span>
    )
  }

  if (freshness.status === 'stale' && freshness.days_stale > 45) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-chip border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${STYLES.stale}`}
        role="status"
        title={`Last researched ${freshness.days_stale} days ago — flagged for a research pass`}
      >
        {compact ? `${freshness.days_stale}d` : `Stale ${freshness.days_stale}d`}
      </span>
    )
  }

  return null
}
