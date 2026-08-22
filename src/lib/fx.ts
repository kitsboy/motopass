/**
 * Honest FX module — real rates, 5-step fallback chain, 'absent' never faked.
 *
 * The chain (per fiat currency):
 *   1. CoinGecko direct BTC→fiat   (no API key, free endpoint)      — primary live
 *   2. CoinGecko BTC→USD × ECB daily fiat-fiat (EUR cross)          — authoritative cross
 *   3. Stored snapshot (public/research/fx-snapshot.json)           — last known good, marked stale
 *   4. Pitch-anchor BTC/USD reference × snapshot fiat cross         — honest fallback, marked stale
 *   5. Absent — ratePerBtc null; UI shows 'FX unavailable', NEVER a fabricated number.
 *
 * A rate that is real but older than STALE_AFTER_MS is marked stale:true so the UI
 * can label it honestly instead of presenting it as live.
 *
 * OTS note: this module has nothing to do with RFC 1404 — that rule applies to
 * OpenTimestamps (Peter Todd's protocol) elsewhere in the project.
 */

import { formatBtc, formatSats } from './btcPrice'

export const SATS_PER_BTC = 100_000_000

export interface FiatMeta {
  code: string
  symbol: string
  name: string
  /** BCP-47 locale used for Intl.NumberFormat fiat rendering. */
  locale: string
}

/** Fiat currencies offered for display. BTC/sats remain the BTC-first default. */
export const FIATS: FiatMeta[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
]

export type FiatCode = (typeof FIATS)[number]['code']
export type DisplayCurrency = 'BTC' | 'SAT' | FiatCode

export type FxSource = 'coingecko' | 'coingecko+ecb' | 'snapshot' | 'pitch-anchor' | 'absent'

export interface FxQuote {
  currency: FiatCode
  /** Fiat units per 1 BTC. null when absent — never faked. */
  ratePerBtc: number | null
  source: FxSource
  /** ISO timestamp of the rate; null when absent. */
  fetchedAt: string | null
  /** True when the rate is real but older than STALE_AFTER_MS (honest marker). */
  stale: boolean
  /** True when no rate could be obtained at all — UI shows 'FX unavailable'. */
  missing: boolean
}

/** Live rates fetched within this window stay fresh; anything older is marked stale. */
export const STALE_AFTER_MS = 12 * 60 * 60 * 1000

/** Hardcoded honest fallback: last known-good BTC/USD reference — kept in sync by scripts/sync-fx-snapshot.mjs. */
export const BTC_USD_REFERENCE = 77_328

export interface FxSnapshot {
  captured_at: string
  btc_usd: number
  per_eur: Partial<Record<FiatCode, number>>
  source: string
}

const SNAPSHOT_URL = '/research/fx-snapshot.json'
const COINGECKO_URL = (currencies: FiatCode[]) =>
  `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencies.join(',')}`
const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'

const COINGECKO_CACHE_MS = 2 * 60 * 1000 // respect free-endpoint rate limits
const ECB_CACHE_MS = 6 * 60 * 60 * 1000 // ECB publishes ~daily

interface TimedCache<T> {
  at: number
  value: T
}

let coingeckoCache: TimedCache<Partial<Record<FiatCode, number>>> | null = null
let ecbCache: TimedCache<{ date: string | null; perEur: Partial<Record<FiatCode, number>> }> | null = null
let snapshotCache: FxSnapshot | null = null

export function resetFxCachesForTests() {
  coingeckoCache = null
  ecbCache = null
  snapshotCache = null
}

/** Fetch live CoinGecko BTC→fiat for the given currencies (no API key). */
export async function fetchCoinGeckoBtcFiat(
  currencies: FiatCode[],
): Promise<Partial<Record<FiatCode, number>>> {
  const url = COINGECKO_URL(currencies)
  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) })
  if (!res.ok) return {}
  const data = (await res.json()) as { bitcoin?: Partial<Record<string, number>> }
  const out: Partial<Record<FiatCode, number>> = {}
  for (const c of currencies) {
    const v = data.bitcoin?.[c.toLowerCase()]
    if (typeof v === 'number' && v > 0) out[c] = v
  }
  return out
}

/** Parse the ECB daily reference XML → per-EUR rates. Regex-based: stable gov format, no DOM needed. */
export function parseEcbDaily(xml: string): { date: string | null; perEur: Partial<Record<FiatCode, number>> } {
  const perEur: Partial<Record<FiatCode, number>> = {}
  const dateMatch = xml.match(/<Cube time='([^']+)'/)
  const date = dateMatch?.[1] ?? null
  const re = /<Cube currency='([A-Z]{3})' rate='([0-9.]+)'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    const code = m[1] as FiatCode
    const rate = Number(m[2])
    if (rate > 0) perEur[code] = rate
  }
  return { date, perEur }
}

export async function fetchEcbDaily(): Promise<{ date: string | null; perEur: Partial<Record<FiatCode, number>> }> {
  const res = await fetch(ECB_URL, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) return { date: null, perEur: {} }
  const xml = await res.text()
  return parseEcbDaily(xml)
}

export async function fetchFxSnapshot(): Promise<FxSnapshot | null> {
  try {
    const res = await fetch(SNAPSHOT_URL, { signal: AbortSignal.timeout(8_000) })
    if (!res.ok) return null
    const data = (await res.json()) as FxSnapshot
    if (typeof data.btc_usd !== 'number' || data.btc_usd <= 0) return null
    return data
  } catch {
    return null
  }
}

async function getCoingecko(now: number): Promise<Partial<Record<FiatCode, number>>> {
  if (coingeckoCache && now - coingeckoCache.at < COINGECKO_CACHE_MS) return coingeckoCache.value
  const rates = await fetchCoinGeckoBtcFiat(FIATS.map((f) => f.code))
  if (Object.keys(rates).length > 0) coingeckoCache = { at: now, value: rates }
  return rates
}

async function getEcb(now: number): Promise<{ date: string | null; perEur: Partial<Record<FiatCode, number>> }> {
  if (ecbCache && now - ecbCache.at < ECB_CACHE_MS) return ecbCache.value
  const data = await fetchEcbDaily()
  if (Object.keys(data.perEur).length > 0) ecbCache = { at: now, value: data }
  return data
}

function quote(currency: FiatCode, ratePerBtc: number, source: FxSource, fetchedAt: string | null, now: number): FxQuote {
  // Stored/fallback sources are by definition not live — mark them stale honestly.
  const alwaysStale = source === 'snapshot' || source === 'pitch-anchor'
  const stale = alwaysStale || (fetchedAt == null ? false : now - new Date(fetchedAt).getTime() > STALE_AFTER_MS)
  return { currency, ratePerBtc, source, fetchedAt, stale, missing: false }
}

function snapshotRate(snap: FxSnapshot, currency: FiatCode): number | null {
  if (currency === 'USD') return snap.btc_usd
  if (currency === 'EUR') return snap.btc_usd / (snap.per_eur.USD ?? 0)
  if (snap.per_eur.USD && snap.per_eur[currency]) {
    return snap.btc_usd * (snap.per_eur[currency]! / snap.per_eur.USD!)
  }
  return null
}

/**
 * Resolve the fiat rate per 1 BTC through the honest 5-step chain.
 * Returns source + stale + missing so the UI can label rates truthfully.
 */
export async function resolveFxRate(currency: FiatCode, opts: { now?: number } = {}): Promise<FxQuote> {
  const now = opts.now ?? Date.now()

  // 1) CoinGecko direct BTC→fiat (no key)
  const cg = await getCoingecko(now)
  if (cg[currency] != null) return quote(currency, cg[currency]!, 'coingecko', new Date(now).toISOString(), now)

  // 2) CoinGecko BTC→USD × ECB daily fiat-fiat (authoritative EUR cross)
  const ecb = await getEcb(now)
  if (cg.USD != null && ecb.perEur.USD) {
    const fiatPerUsd =
      currency === 'EUR' ? 1 / ecb.perEur.USD : ecb.perEur[currency] ? ecb.perEur[currency]! / ecb.perEur.USD! : null
    if (fiatPerUsd != null) {
      const rate = cg.USD * fiatPerUsd
      return quote(currency, rate, 'coingecko+ecb', new Date(now).toISOString(), now)
    }
  }

  // 3) Stored snapshot — last known good, honestly marked stale
  const snap = snapshotCache ?? (await fetchFxSnapshot())
  if (snap) snapshotCache = snap
  if (snap) {
    const rate = snapshotRate(snap, currency)
    if (rate != null) return quote(currency, rate, 'snapshot', snap.captured_at, now)
  }

  // 4) Pitch-anchor reference BTC/USD × snapshot fiat cross — honest fallback, stale
  if (currency === 'USD') {
    return quote(currency, BTC_USD_REFERENCE, 'pitch-anchor', '2026-08-22T21:30:00Z', now)
  }
  if (snap?.per_eur.USD && snap.per_eur[currency]) {
    const rate = BTC_USD_REFERENCE * (snap.per_eur[currency]! / snap.per_eur.USD!)
    return quote(currency, rate, 'pitch-anchor', snap.captured_at, now)
  }

  // 5) Absent — never faked
  return { currency, ratePerBtc: null, source: 'absent', fetchedAt: null, stale: false, missing: true }
}

/** Format a fiat amount in its natural locale + currency. */
export function formatFiat(value: number, meta: FiatMeta, compact = false): string {
  try {
    if (compact) {
      return new Intl.NumberFormat(meta.locale, {
        style: 'currency',
        currency: meta.code,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)
    }
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      maximumFractionDigits: meta.code === 'JPY' || meta.code === 'INR' ? 0 : 2,
    }).format(value)
  } catch {
    return `${meta.symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  }
}

export interface Priced {
  /** Primary figure — always in the ACTIVE display currency (BTC-first default = sats). */
  primary: string
  /** Muted secondary figure (BTC/sats counterpart). */
  secondary: string
  currency: DisplayCurrency
  stale: boolean
  /** True when the requested fiat conversion could not be resolved — honest 'absent'. */
  missing: boolean
  source: FxSource | 'btc'
}

/**
 * BTC-first pricing: a stored USD figure is anchored to sats via btcUsdCapture
 * (btc_price_at_capture), then displayed in the active currency. Fiat conversions
 * use the live/fallback FX quote and are honestly marked stale/missing.
 */
export function priceForDisplay(
  usd: number,
  btcUsdCapture: number,
  currency: DisplayCurrency,
  fx: FxQuote | null,
): Priced {
  const sats = Math.round((usd / btcUsdCapture) * SATS_PER_BTC)
  const btc = usd / btcUsdCapture

  if (currency === 'BTC') {
    return { primary: formatBtc(btc), secondary: formatSats(sats), currency, stale: false, missing: false, source: 'btc' }
  }
  if (currency === 'SAT') {
    return { primary: formatSats(sats), secondary: formatBtc(btc), currency, stale: false, missing: false, source: 'btc' }
  }

  const meta = FIATS.find((f) => f.code === currency)
  if (!meta || !fx || fx.missing || fx.ratePerBtc == null) {
    // Honest 'absent': show the BTC-anchored figure, never a fabricated fiat number.
    return { primary: '—', secondary: formatSats(sats), currency, stale: false, missing: true, source: 'absent' }
  }
  const fiatValue = btc * fx.ratePerBtc
  return {
    primary: formatFiat(fiatValue, meta),
    secondary: formatSats(sats),
    currency,
    stale: fx.stale,
    missing: false,
    source: fx.source,
  }
}

