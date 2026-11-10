import { CAPTURE_RATE, anchorAgeDays, isRateStale, rateLine, rateTitle } from '../lib/satsAnchor'

/**
 * The rate and capture date behind a sats figure.
 *
 * Programme figures are stored in dollars and shown in sats through this one
 * anchor. Putting the date on screen is the point: a sats number without it
 * is a different claim every day.
 */
export function SatsAnchorNote({ className = '' }: { className?: string }) {
  const age = anchorAgeDays(CAPTURE_RATE.capturedAt)
  const stale = isRateStale(CAPTURE_RATE)
  return (
    <p className={`text-[10px] leading-relaxed text-mp-ink-tertiary ${className}`} title={rateTitle(CAPTURE_RATE)}>
      Sats at <span className="font-mono text-mp-ink-secondary">{rateLine(CAPTURE_RATE)}</span>
      {age != null ? ` · ${age} ${age === 1 ? 'day' : 'days'} old` : ''}
      {stale && <span className="text-mp-wax"> · refresh due</span>}
    </p>
  )
}
