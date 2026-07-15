/** Bitcoin-first dual-currency formatting. USD is secondary context only. */

export const SATS_PER_BTC = 100_000_000

/** Fallback when live feed unavailable — refreshed by `npm run pitch:sync`. */
export const BTC_USD_REFERENCE = 105_000

export type BtcUsdQuote = {
  usd: number
  source: 'mempool.space' | 'pitch-anchor' | 'fallback'
  fetchedAt: string
}

export function usdToBtc(usd: number, btcUsdRate: number): number {
  if (!btcUsdRate || btcUsdRate <= 0) return 0
  return usd / btcUsdRate
}

export function usdToSats(usd: number, btcUsdRate: number): number {
  return Math.round(usdToBtc(usd, btcUsdRate) * SATS_PER_BTC)
}

export function formatBtc(btc: number, opts?: { maxDecimals?: number }): string {
  const max = opts?.maxDecimals ?? 4
  if (btc >= 100) return `₿${btc.toFixed(1)}`
  if (btc >= 1) return `₿${btc.toFixed(2)}`
  if (btc >= 0.01) return `₿${btc.toFixed(max)}`
  if (btc >= 0.0001) return `₿${btc.toFixed(6)}`
  return `₿${btc.toFixed(8)}`
}

export function formatSats(sats: number): string {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M sats`
  if (sats >= 1_000) return `${Math.round(sats / 1_000)}k sats`
  return `${sats.toLocaleString()} sats`
}

export function formatUsdCompact(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`
  if (usd >= 10_000) return `$${Math.round(usd / 1000)}k`
  if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}k`
  return `$${usd.toLocaleString()}`
}

/** Bitcoin-first: ₿ primary, USD muted secondary. */
export function formatDualUsd(usd: number, btcUsdRate: number): { btc: string; usd: string; sats: string } {
  const btc = usdToBtc(usd, btcUsdRate)
  const sats = usdToSats(usd, btcUsdRate)
  return {
    btc: formatBtc(btc),
    usd: formatUsdCompact(usd),
    sats: formatSats(sats),
  }
}

export async function fetchBtcUsdPrice(): Promise<BtcUsdQuote | null> {
  try {
    const res = await fetch('https://mempool.space/api/v1/prices')
    if (!res.ok) return null
    const data = (await res.json()) as { USD?: number }
    const usd = data.USD
    if (typeof usd !== 'number' || usd <= 0) return null
    return { usd, source: 'mempool.space', fetchedAt: new Date().toISOString() }
  } catch {
    return null
  }
}

export async function loadPitchAnchorReference(): Promise<number> {
  try {
    const res = await fetch('/research/pitch-anchor.json')
    if (!res.ok) return BTC_USD_REFERENCE
    const data = (await res.json()) as { btc_usd_reference?: number }
    const ref = data.btc_usd_reference
    return typeof ref === 'number' && ref > 0 ? ref : BTC_USD_REFERENCE
  } catch {
    return BTC_USD_REFERENCE
  }
}