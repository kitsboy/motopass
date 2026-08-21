/**
 * Intel source adapters — fetch real-world data for country programs.
 *
 * Each adapter returns structured facts or null on failure.
 * Adapters are designed for CI (no browser, bounded concurrency, graceful failure).
 *
 * Sources (in priority order):
 *   1. Wikipedia REST API — reliable, free, structured summaries + sections
 *   2. BTC Map API — merchant density + Lightning readiness signal
 *   3. (Future: government portals, news APIs, immigration databases)
 */

import { createHash } from 'node:crypto'

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1'
const BTCMAP_API = 'https://api.btcmap.org'

// BTC Map uses lat/lon/radius_km for spatial queries — mirrors fetch-btcmap-density.mjs
const BTCMAP_COORDS = {
  'El Salvador': { lat: 13.6929, lon: -89.2182, radiusKm: 80 },
  'Central African Republic': { lat: 4.3947, lon: 18.5582, radiusKm: 60 },
  'Uruguay': { lat: -34.9011, lon: -56.1645, radiusKm: 50 },
  'Bolivia': { lat: -16.4897, lon: -68.1193, radiusKm: 40 },
  'St. Kitts and Nevis': { lat: 17.3026, lon: -62.7177, radiusKm: 25 },
  'Antigua and Barbuda': { lat: 17.1274, lon: -61.8468, radiusKm: 25 },
  'Dominica': { lat: 15.3010, lon: -61.3881, radiusKm: 25 },
  'Hong Kong': { lat: 22.3193, lon: 114.1694, radiusKm: 25 },
  'Thailand': { lat: 13.7563, lon: 100.5018, radiusKm: 50 },
  'Portugal': { lat: 38.7223, lon: -9.1393, radiusKm: 50 },
  'Malta': { lat: 35.8989, lon: 14.5146, radiusKm: 20 },
  'Panama': { lat: 8.9824, lon: -79.5199, radiusKm: 40 },
  'Georgia': { lat: 41.7151, lon: 44.8271, radiusKm: 40 },
  'Paraguay': { lat: -25.2637, lon: -57.5759, radiusKm: 40 },
  'Costa Rica': { lat: 9.9281, lon: -84.0907, radiusKm: 45 },
  'Vanuatu': { lat: -17.7333, lon: 168.3273, radiusKm: 30 },
  'Mauritius': { lat: -20.1609, lon: 57.5012, radiusKm: 30 },
  'Brazil': { lat: -15.7939, lon: -47.8828, radiusKm: 60 },
  'Argentina': { lat: -34.6037, lon: -58.3816, radiusKm: 50 },
  'Colombia': { lat: 4.7110, lon: -74.0721, radiusKm: 50 },
  'St. Lucia': { lat: 14.0101, lon: -60.9875, radiusKm: 20 },
  'Barbados': { lat: 13.1939, lon: -59.5432, radiusKm: 20 },
  'Bahamas': { lat: 25.0343, lon: -77.3963, radiusKm: 30 },
  'Belize': { lat: 17.2510, lon: -88.7590, radiusKm: 30 },
  'Cayman Islands': { lat: 19.2869, lon: -81.3674, radiusKm: 15 },
  'Andorra': { lat: 42.5063, lon: 1.5218, radiusKm: 15 },
  'Latvia': { lat: 56.9496, lon: 24.1052, radiusKm: 35 },
  'Estonia': { lat: 59.4370, lon: 24.7536, radiusKm: 35 },
  'Bulgaria': { lat: 42.6977, lon: 23.3219, radiusKm: 40 },
  'Croatia': { lat: 45.8150, lon: 15.9819, radiusKm: 40 },
  'Singapore': { lat: 1.3521, lon: 103.8198, radiusKm: 35 },
  'Malaysia': { lat: 3.1390, lon: 101.6869, radiusKm: 45 },
  'Philippines': { lat: 14.5995, lon: 120.9842, radiusKm: 50 },
  'Indonesia': { lat: -6.2088, lon: 106.8456, radiusKm: 55 },
  'Mexico': { lat: 19.4326, lon: -99.1332, radiusKm: 60 },
  'Vietnam': { lat: 10.8231, lon: 106.6297, radiusKm: 50 },
  'Nigeria': { lat: 9.0820, lon: 8.6753, radiusKm: 50 },
  'Ghana': { lat: 5.6037, lon: -0.1870, radiusKm: 40 },
  'South Africa': { lat: -33.9249, lon: 18.4241, radiusKm: 50 },
  'Kenya': { lat: -1.2921, lon: 36.8219, radiusKm: 40 },
  'Rwanda': { lat: -1.9403, lon: 29.8739, radiusKm: 30 },
  'Zanzibar': { lat: -6.1659, lon: 39.2026, radiusKm: 20 },
}
const FETCH_TIMEOUT_MS = 12_000
const USER_AGENT = 'motopass-intel-fetch/1.0 (+https://motopass.giveabit.io)'

// ── Wikipedia name → page-title mapping ──────────────────────────────────────
// Most match directly; exceptions listed here.
const WIKI_TITLE_MAP = {
  'El Salvador': 'Bitcoin_Law',
  'Central African Republic': 'Cryptocurrency_in_the_Central_African_Republic',
  'Saint Kitts and Nevis': 'Saint_Kitts_and_Nevis',
  'St. Kitts and Nevis': 'Saint_Kitts_and_Nevis',
  'Antigua and Barbuda': 'Antigua_and_Barbuda',
  'Saint Lucia': 'Saint_Lucia',
  'St. Lucia': 'Saint_Lucia',
  'Saint Vincent and the Grenadines': 'Saint_Vincent_and_the_Grenadines',
  'St. Vincent and the Grenadines': 'Saint_Vincent_and_the_Grenadines',
  'Czech Republic': 'Czech_Republic',
  'Czechia': 'Czech_Republic',
  'United Arab Emirates': 'United_Arab_Emirates',
  'Trinidad and Tobago': 'Trinidad_and_Tobago',
  'Cape Verde': 'Cape_Verde',
  'Cabo Verde': 'Cape_Verde',
  'Timor-Leste': 'East_Timor',
  'North Macedonia': 'North_Macedonia',
  'Hong Kong': 'Hong_Kong',
  'Singapore': 'Singapore',
  'Georgia': 'Georgia_(country)',
  'Malta': 'Malta',
  'Portugal': 'Portugal',
  'Panama': 'Panama',
  'Costa Rica': 'Costa_Rica',
  'Uruguay': 'Uruguay',
  'Paraguay': 'Paraguay',
  'Bolivia': 'Bolivia',
  'Estonia': 'Estonia',
  'Latvia': 'Latvia',
  'Lithuania': 'Lithuania',
  'Bulgaria': 'Bulgaria',
  'Croatia': 'Croatia',
  'Cayman Islands': 'Cayman_Islands',
  'Barbados': 'Barbados',
  'Bahamas': 'The_Bahamas',
  'Belize': 'Belize',
  'Andorra': 'Andorra',
  'Dominica': 'Dominica',
  'Vanuatu': 'Vanuatu',
  'Thailand': 'Thailand',
  'Brazil': 'Brazil',
  'Argentina': 'Argentina',
  'Colombia': 'Colombia',
  'Mexico': 'Mexico',
  'Malaysia': 'Malaysia',
  'Philippines': 'Philippines',
  'Indonesia': 'Indonesia',
  'Vietnam': 'Vietnam',
  'Nigeria': 'Nigeria',
  'Ghana': 'Ghana',
  'South Africa': 'South_Africa',
  'Kenya': 'Kenya',
  'Mauritius': 'Mauritius',
  'Rwanda': 'Rwanda',
  'Zanzibar': 'Zanzibar',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJSON(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchText(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

function wikiTitle(countryName) {
  return WIKI_TITLE_MAP[countryName] ?? countryName.replace(/[\s()]+/g, '_')
}

// ── Wikipedia adapter ────────────────────────────────────────────────────────

/**
 * Fetch Wikipedia summary + section text for a country.
 * Returns { summary, sections: {title, text}[], lastModified } or null.
 */
export async function fetchWikipedia(countryName) {
  const title = wikiTitle(countryName)
  try {
    // 1) Summary (fast, structured)
    const summary = await fetchJSON(`${WIKI_API}/page/summary/${encodeURIComponent(title)}`)
    const lastModified = summary.timestamp ?? null

    // 2) Full page HTML → extract key sections
    let sections = []
    try {
      const html = await fetchText(`${WIKI_API}/page/html/${encodeURIComponent(title)}`)
      sections = extractSections(html)
    } catch {
      // HTML fetch failed — summary-only is still useful
    }

    return {
      source: 'wikipedia',
      pageTitle: title,
      summary: summary.extract ?? null,
      description: summary.description ?? null,
      lastModified,
      sections,
      contentHash: createHash('sha256').update(summary.extract ?? '').digest('hex'),
    }
  } catch {
    return null
  }
}

/**
 * Extract text from key <section> elements in Wikipedia REST HTML.
 * Focuses on sections relevant to residency / citizenship / finance.
 */
function extractSections(html) {
  const sectionRegex = /<section[^>]*data-mw-section-id="([^"]*)"[^>]*>([\s\S]*?)<\/section>/gi
  const relevantIds = [
    'Economy', 'Finance', 'Taxation', 'Immigration', 'Citizenship',
    'Government_and_politics', 'Law', 'Cryptocurrency', 'Technology',
    'Bitcoin', 'Regulation', 'Tourism',
  ]
  const results = []
  let match

  while ((match = sectionRegex.exec(html)) !== null) {
    const id = match[1]
    const raw = match[2]
    // Strip HTML tags for plain text
    const text = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000) // cap per section

    if (text.length > 50) {
      results.push({ id, title: id.replace(/_/g, ' '), text })
    }
  }

  // If no relevant sections found, grab the first few non-trivial ones
  if (results.length === 0) {
    const allSections = []
    const allRegex = /<section[^>]*>([\s\S]*?)<\/section>/gi
    while ((match = allRegex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500)
      if (text.length > 100) allSections.push(text)
    }
    // Return up to 3 largest sections as context
    return allSections
      .sort((a, b) => b.length - a.length)
      .slice(0, 3)
      .map((text, i) => ({ id: `context_${i}`, title: 'Context', text }))
  }

  return results
}

// ── BTC Map adapter ──────────────────────────────────────────────────────────

/**
 * Fetch BTC Map merchant count + Lightning signal for a country.
 * Returns { merchantCount, lightningCount, lastVerified } or null.
 */
export async function fetchBtcMap(countryName) {
  const coords = BTCMAP_COORDS[countryName]
  if (!coords) return null

  try {
    const q = new URLSearchParams({
      lat: String(coords.lat),
      lon: String(coords.lon),
      radius_km: String(coords.radiusKm),
    })
    const places = await fetchJSON(`${BTCMAP_API}/v4/places/search/?${q}`)
    if (!Array.isArray(places)) return null

    const merchants = places.length
    const lightning = places.filter(m => m.tags?.payment?.lightning === 'yes').length

    return {
      source: 'btcmap',
      merchantCount: merchants,
      lightningCount: lightning,
      lastVerified: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// ── Exchange-rate / crypto-climate adapter ────────────────────────────────────

/**
 * Fetch a lightweight crypto-climate signal for a country.
 * Uses CoinGecko's public /simple/price for BTC local-currency conversion.
 * Returns { btcLocalPrice, currencyCode } or null.
 */
export async function fetchCryptoClimate(countryName, currencyCode) {
  if (!currencyCode) return null
  try {
    const res = await fetchJSON(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode.toLowerCase()}`
    )
    const price = res?.bitcoin?.[currencyCode.toLowerCase()]
    if (price == null) return null
    return {
      source: 'coingecko',
      btcLocalPrice: price,
      currencyCode,
    }
  } catch {
    return null
  }
}

// ── Currency code map (for CoinGecko) ────────────────────────────────────────
const CURRENCY_MAP = {
  'El Salvador': 'USD', 'Panama': 'USD', 'Costa Rica': 'CRC',
  'Uruguay': 'UYU', 'Paraguay': 'PYG', 'Bolivia': 'BOB',
  'Portugal': 'EUR', 'Malta': 'EUR', 'Estonia': 'EUR',
  'Latvia': 'EUR', 'Lithuania': 'EUR', 'Bulgaria': 'BGN',
  'Croatia': 'EUR', 'Georgia': 'GEL', 'Thailand': 'THB',
  'Brazil': 'BRL', 'Argentina': 'ARS', 'Colombia': 'COP',
  'Mexico': 'MXN', 'Malaysia': 'MYR', 'Philippines': 'PHP',
  'Indonesia': 'IDR', 'Vietnam': 'VND', 'Nigeria': 'NGN',
  'Ghana': 'GHS', 'South Africa': 'ZAR', 'Kenya': 'KES',
  'Mauritius': 'MUR', 'Singapore': 'SGD', 'Hong Kong': 'HKD',
  'Dominica': 'XCD', 'St. Kitts and Nevis': 'XCD',
  'Antigua and Barbuda': 'XCD', 'Saint Lucia': 'XCD',
  'St. Lucia': 'XCD', 'Bahamas': 'BSD', 'Belize': 'BZD',
  'Cayman Islands': 'KYD', 'Barbados': 'BBD',
  'Vanuatu': 'VUV', 'Andorra': 'EUR', 'Central African Republic': 'XAF',
  'Trinidad and Tobago': 'TTD', 'Czech Republic': 'CZK',
  'Czechia': 'CZK', 'Cabo Verde': 'CVE', 'Cape Verde': 'CVE',
  'Timor-Leste': 'USD', 'North Macedonia': 'MKD',
  'Rwanda': 'RWF', 'Zanzibar': 'TZS',
}

export function getCurrencyCode(countryName) {
  return CURRENCY_MAP[countryName] ?? null
}

// ── Orchestrator: fetch all sources for a country ────────────────────────────

/**
 * Fetch all available intel for a single country.
 * Returns { wikipedia, btcmap, cryptoClimate } with nulls for failed sources.
 */
export async function fetchAllSources(countryName) {
  const [wikipedia, btcmap, cryptoClimate] = await Promise.all([
    fetchWikipedia(countryName).catch(() => null),
    fetchBtcMap(countryName).catch(() => null),
    fetchCryptoClimate(countryName, getCurrencyCode(countryName)).catch(() => null),
  ])

  return { wikipedia, btcmap, cryptoClimate }
}
