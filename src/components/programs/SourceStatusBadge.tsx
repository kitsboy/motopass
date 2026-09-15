import { ShieldCheck, ShieldAlert, Radar } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import { useSourceMonitor, ageLabel, type SourceLevel } from '../../hooks/useSourceMonitor'

/**
 * SourceStatusBadge
 *
 * Shows the live status of a country's OFFICIAL SOURCE as tracked by the
 * MotoPass source watchdog (re-checked every 24h).
 *
 * Levels:
 *   ok      — at least one official source read successfully (quiet green)
 *   changed — a confirmed rule change is recorded (amber — the thing we promise)
 *   walled  — every watched source is bot-walled / unreachable (honest grey)
 *
 * Renders nothing when the feed is unavailable, so the card degrades quietly.
 * A plain <span> (not a link) on purpose: cards are tap-anywhere buttons, and
 * nesting an anchor inside them is invalid HTML. The Source Monitor itself is
 * reachable from nav → Sources and from the alert inbox.
 */
const LEVEL_STYLES: Record<SourceLevel, string> = {
  ok: 'border-mp-proof/30 bg-mp-proof-soft text-mp-proof',
  changed: 'border-status-amber/40 bg-mp-btc-soft text-mp-btc-text',
  walled: 'border-mp-border-strong bg-mp-section text-mp-ink-secondary',
}

export function SourceStatusBadge({ programName }: { programName: string }) {
  const { t } = useI18n()
  const { byCountry } = useSourceMonitor()
  const health = byCountry.get(programName)
  if (!health) return null

  const age = ageLabel(health.probed)
  const label =
    health.level === 'changed'
      ? t('source.changed')
      : health.level === 'walled'
        ? t('source.walled')
        : t('source.ok')

  const Icon = health.level === 'changed' ? ShieldAlert : health.level === 'walled' ? Radar : ShieldCheck
  const title = `${t('source.tooltip')} · ${health.okCount}/${health.total} ${t('source.readable')}${
    age ? ` · ${t('source.checked')} ${age}` : ''
  }${health.coverageGapDays ? ` · ${health.coverageGapDays}d ${t('source.gap')}` : ''}`

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-chip border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] ${LEVEL_STYLES[health.level]}`}
      role="status"
      title={title}
      aria-label={title}
    >
      <Icon size={9} aria-hidden="true" />
      <span>
        {label}
        {age ? ` · ${age}` : ''}
      </span>
    </span>
  )
}
