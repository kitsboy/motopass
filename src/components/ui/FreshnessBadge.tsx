import { CalendarClock } from 'lucide-react'
import {
  formatFreshnessLabel,
  freshnessLevel,
  resolveFreshnessDate,
  type FreshnessLevel,
} from '../../lib/programFreshness'

interface FreshnessBadgeProps {
  lastChecked?: string
  proofStampedAt?: string
  compact?: boolean
  /** i18n labels keyed by level + source */
  labels: {
    fresh: string
    recent: string
    stale: string
    proof: string
    checked: string
  }
}

const LEVEL_STYLES: Record<FreshnessLevel, string> = {
  fresh: 'border-mp-proof/30 bg-mp-proof-soft text-mp-proof',
  recent: 'border-mp-ochre/40 bg-mp-btc-soft text-mp-btc-text',
  stale: 'border-mp-border-strong bg-mp-section text-mp-ink-tertiary',
}

export function FreshnessBadge({ lastChecked, proofStampedAt, compact = false, labels }: FreshnessBadgeProps) {
  const iso = resolveFreshnessDate(lastChecked, proofStampedAt)
  if (!iso) return null

  const level = freshnessLevel(iso)
  const fromProof = !!proofStampedAt?.slice(0, 10)
  const dateLabel = formatFreshnessLabel(iso)
  const levelLabel = labels[level]
  const sourceLabel = fromProof ? labels.proof : labels.checked

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-chip border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${LEVEL_STYLES[level]}`}
      role="status"
      title={`${sourceLabel} · ${iso}`}
    >
      <CalendarClock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      <span>{compact ? dateLabel : `${levelLabel} · ${dateLabel}`}</span>
    </span>
  )
}