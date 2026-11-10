import { BTC_USD_AT_CAPTURE, CAPTURED_AT, CAPTURE_PRICE_SOURCE } from '../data/btcPriceAtCapture'

/**
 * The dated rate behind every sats figure.
 *
 * A sats number is a commitment only if you can see the rate that produced it.
 * Stored programme figures are dollars, so they become sats through one anchor:
 * the capture price recorded with the dataset. Nothing here fetches a live
 * quote — a live ticker would make the same dollar figure change meaning
 * minute to minute, which is exactly what this file exists to stop.
 */

export const SATS_PER_BTC = 100_000_000

export interface SatsRate {
  /** USD per whole BTC at capture */
  btcUsd: number
  /** ISO timestamp of the quote */
  capturedAt: string
  source: string
}

export const CAPTURE_RATE: SatsRate = Object.freeze({
  btcUsd: BTC_USD_AT_CAPTURE,
  capturedAt: CAPTURED_AT,
  source: CAPTURE_PRICE_SOURCE,
})

/** Null on a negative/non-finite amount or an unusable rate — never 0 as a guess. */
export function satsFromUsd(usd: number, btcUsd: number = CAPTURE_RATE.btcUsd): number | null {
  if (!Number.isFinite(usd) || usd < 0) return null
  if (!Number.isFinite(btcUsd) || btcUsd <= 0) return null
  return Math.round((usd / btcUsd) * SATS_PER_BTC)
}

export function usdFromSats(sats: number, btcUsd: number = CAPTURE_RATE.btcUsd): number | null {
  if (!Number.isFinite(sats) || sats < 0) return null
  if (!Number.isFinite(btcUsd) || btcUsd <= 0) return null
  return (sats / SATS_PER_BTC) * btcUsd
}

/** Whole days since capture, or null when the timestamp cannot be read. */
export function anchorAgeDays(capturedAt: string, now: number = Date.now()): number | null {
  const parsed = Date.parse(capturedAt)
  if (!Number.isFinite(parsed)) return null
  const days = Math.floor((now - parsed) / 86_400_000)
  return days >= 0 ? days : null
}

/** Exact sats, grouped — no "12k sats" rounding on a payment-shaped figure. */
export function formatSatsExact(sats: number): string {
  if (!Number.isFinite(sats)) return '—'
  return `${Math.round(sats).toLocaleString('en-US')} sats`
}

export function rateLine(rate: SatsRate = CAPTURE_RATE): string {
  const usd = Math.round(rate.btcUsd).toLocaleString('en-US')
  return `₿1 = $${usd} · captured ${rate.capturedAt.slice(0, 10)}`
}

export function rateTitle(rate: SatsRate = CAPTURE_RATE, now: number = Date.now()): string {
  const age = anchorAgeDays(rate.capturedAt, now)
  const agePart = age == null ? '' : ` · ${age} ${age === 1 ? 'day' : 'days'} old`
  return `Sats computed at ${rateLine(rate)}${agePart} · source: ${rate.source}`
}

export function isRateStale(rate: SatsRate = CAPTURE_RATE, days = 30, now: number = Date.now()): boolean {
  const age = anchorAgeDays(rate.capturedAt, now)
  return age == null ? true : age > days
}
