import { Clock, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Program } from '../programs/types'
import { hasFlagshipDepth } from '../programs/types'

type ComplianceClockProps = {
  program: Program
  acquiredAt?: string
}

export type ComplianceSeverity = 'critical' | 'warning' | 'healthy'

function daysSince(iso?: string): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000))
}

export function complianceSeverity(daysToRenewal: number): ComplianceSeverity {
  if (daysToRenewal <= 30) return 'critical'
  if (daysToRenewal <= 90) return 'warning'
  return 'healthy'
}

const SEVERITY_STYLES: Record<
  ComplianceSeverity,
  { border: string; badge: string; bar: string; icon: typeof Clock; iconClass: string }
> = {
  critical: {
    border: 'border-l-status-red',
    badge: 'border-status-red/40 bg-status-red/10 text-status-red',
    bar: 'bg-status-red',
    icon: AlertTriangle,
    iconClass: 'text-status-red',
  },
  warning: {
    border: 'border-l-status-amber',
    badge: 'border-status-amber/40 bg-status-amber/10 text-status-amber',
    bar: 'bg-status-amber',
    icon: Clock,
    iconClass: 'text-status-amber',
  },
  healthy: {
    border: 'border-l-mp-proof',
    badge: 'border-mp-proof/40 bg-mp-proof/10 text-mp-proof',
    bar: 'bg-mp-proof',
    icon: CheckCircle2,
    iconClass: 'text-mp-proof',
  },
}

export function ComplianceClock({ program, acquiredAt }: ComplianceClockProps) {
  if (!hasFlagshipDepth(program) || !program.complianceClock) return null
  const clock = program.complianceClock
  const daysIn = daysSince(acquiredAt)
  const renewalDays = clock.renewal_interval_months * 30
  const daysToRenewal = Math.max(0, renewalDays - (daysIn % renewalDays))
  const severity = complianceSeverity(daysToRenewal)
  const styles = SEVERITY_STYLES[severity]
  const SeverityIcon = styles.icon
  const citizenshipPct = clock.citizenship_eligibility_years
    ? Math.min(100, Math.round((daysIn / (clock.citizenship_eligibility_years * 365)) * 100))
    : null

  return (
    <div
      className={`glass-card !p-4 border-l-4 ${styles.border} hover:border-btc-orange/30 hover:-translate-y-0.5 transition-all duration-base`}
    >
      <div className="flex items-center gap-2 mb-3">
        <SeverityIcon size={14} className={styles.iconClass} aria-hidden />
        <span className="font-chrome text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Compliance clock
        </span>
        <span className={`ml-auto rounded-chip border px-2 py-0.5 text-[9px] font-mono uppercase ${styles.badge}`}>
          {severity}
        </span>
      </div>
      <p className="font-display text-sm font-semibold text-ink mb-3">{program.country}</p>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div className="card-muted">
          <dt className="text-ink-muted uppercase tracking-wide text-[10px]">Renewal window</dt>
          <dd className="font-mono text-ink mt-1">~{daysToRenewal}d</dd>
        </div>
        <div className="card-muted">
          <dt className="text-ink-muted uppercase tracking-wide text-[10px]">Residency target</dt>
          <dd className="font-mono text-ink mt-1">{clock.residency_day_count_target}d</dd>
        </div>
        {citizenshipPct != null && (
          <div className="col-span-2 card-muted">
            <dt className="text-ink-muted uppercase tracking-wide text-[10px] flex items-center gap-1">
              <Shield size={10} /> Citizenship track
            </dt>
            <dd className="mt-2">
              <div className="h-2 rounded-chip bg-section overflow-hidden">
                <div
                  className={`h-full rounded-chip transition-all duration-slow ${styles.bar}`}
                  style={{ width: `${citizenshipPct}%` }}
                />
              </div>
              <span className="font-mono text-[11px] mt-1 block text-ink-secondary">
                {citizenshipPct}% · {clock.citizenship_eligibility_years}yr path
              </span>
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}