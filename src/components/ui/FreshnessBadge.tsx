import { CalendarClock } from 'lucide-react'
import {
  formatFreshnessLabel,
  freshnessLevel,
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
  stale: 'border-mp-border-strong bg-mp-section text-mp-ink-secondary',
}

export function FreshnessBadge({ lastChecked, proofStampedAt, compact = false, labels }: FreshnessBadgeProps) {
  const checkedIso = lastChecked?.slice(0, 10) || null
  const proofIso = proofStampedAt?.slice(0, 10) || null
  if (!checkedIso && !proofIso) return null

  const level = checkedIso ? freshnessLevel(checkedIso) : null
  const levelLabel = level ? labels[level] : null
  const displayIso = checkedIso ?? proofIso!
  const dateLabel = formatFreshnessLabel(displayIso)
  const titleParts = [
    checkedIso && `${labels.checked} · ${formatFreshnessLabel(checkedIso)} (${checkedIso})`,
    proofIso && `${labels.proof} · ${formatFreshnessLabel(proofIso)} (${proofIso})`,
  ].filter(Boolean)
  const title = titleParts.join(' · ')
  const badgeLabel = levelLabel ? `${levelLabel} · ${dateLabel}` : `${labels.proof} · ${dateLabel}`
  const style = level ? LEVEL_STYLES[level] : 'border-mp-border-strong bg-mp-section text-mp-ink-secondary'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-chip border px-1.5 py-0.5 font-mono uppercase tracking-[0.06em] ${compact ? 'text-[9px]' : 'text-[10px]'} ${style}`}
      role="status"
      title={title}
      aria-label={title}
    >
      <CalendarClock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      <span>{badgeLabel}</span>
    </span>
  )
}
