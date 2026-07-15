import { Clock, Shield } from 'lucide-react'
import type { Program } from '../programs/types'
import { hasFlagshipDepth } from '../programs/types'

type ComplianceClockProps = {
  program: Program
  acquiredAt?: string
}

function daysSince(iso?: string): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000))
}

export function ComplianceClock({ program, acquiredAt }: ComplianceClockProps) {
  if (!hasFlagshipDepth(program) || !program.complianceClock) return null
  const clock = program.complianceClock
  const daysIn = daysSince(acquiredAt)
  const renewalDays = clock.renewal_interval_months * 30
  const daysToRenewal = Math.max(0, renewalDays - (daysIn % renewalDays))
  const citizenshipPct = clock.citizenship_eligibility_years
    ? Math.min(100, Math.round((daysIn / (clock.citizenship_eligibility_years * 365)) * 100))
    : null

  return (
    <div className="rounded-card border border-mp-border border-l-4 border-l-mp-btc bg-mp-card p-4 shadow-mp-1">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-mp-btc" />
        <span className="font-chrome text-[11px] uppercase tracking-[0.14em] text-mp-ink-tertiary">
          Compliance clock
        </span>
        <span className="font-display text-sm font-semibold text-mp-ink ml-auto">{program.country}</span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div className="card-muted">
          <dt className="text-mp-ink-muted uppercase tracking-wide text-[10px]">Renewal window</dt>
          <dd className="font-mono text-mp-ink mt-1">~{daysToRenewal}d</dd>
        </div>
        <div className="card-muted">
          <dt className="text-mp-ink-muted uppercase tracking-wide text-[10px]">Residency target</dt>
          <dd className="font-mono text-mp-ink mt-1">{clock.residency_day_count_target}d</dd>
        </div>
        {citizenshipPct != null && (
          <div className="col-span-2 card-muted">
            <dt className="text-mp-ink-muted uppercase tracking-wide text-[10px] flex items-center gap-1">
              <Shield size={10} /> Citizenship track
            </dt>
            <dd className="mt-2">
              <div className="h-2 rounded-chip bg-mp-section overflow-hidden">
                <div
                  className="h-full bg-mp-btc rounded-chip transition-all duration-slow"
                  style={{ width: `${citizenshipPct}%` }}
                />
              </div>
              <span className="font-mono text-mp-btc-text text-[11px] mt-1 block">
                {citizenshipPct}% · {clock.citizenship_eligibility_years}yr path
              </span>
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}