import type { ProgramScorecard } from '../../types/program'

interface ScorecardBarsProps {
  scorecard: ProgramScorecard
}

/** Numeric metrics only — `note` is excluded from the bar set. */
type MetricKey = Exclude<keyof ProgramScorecard, 'note'>

const METRICS: Array<{ key: MetricKey; label: string }> = [
  { key: 'crypto_friendly', label: 'Crypto friendly' },
  { key: 'freedom', label: 'Freedom' },
  { key: 'stability', label: 'Stability' },
  { key: 'tax', label: 'Tax' },
  { key: 'cost', label: 'Cost' },
  { key: 'mobility', label: 'Mobility' },
  { key: 'banking', label: 'Banking' },
]

function barColor(score: number): string {
  if (score >= 8) return 'bg-mp-proof'
  if (score >= 5) return 'bg-mp-btc'
  return 'bg-mp-wax'
}

/** 7-metric intel scorecard — null = honest “research pending”, never a 0. */
export function ScorecardBars({ scorecard }: ScorecardBarsProps) {
  return (
    <div className="space-y-2.5">
      {METRICS.map(({ key, label }) => {
        const value = scorecard[key] as number | null
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary">
              {label}
            </span>
            {value == null ? (
              <span className="text-[11px] font-mono italic text-mp-ink-muted">research pending</span>
            ) : (
              <div className="flex flex-1 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mp-section">
                  <div
                    className={`h-full rounded-full ${barColor(value)}`}
                    style={{ width: `${value * 10}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-[11px] text-mp-ink">{value}/10</span>
              </div>
            )}
          </div>
        )
      })}
      {scorecard.note && (
        <p className="pt-1 text-[10px] leading-relaxed text-mp-ink-muted">{scorecard.note}</p>
      )}
    </div>
  )
}
