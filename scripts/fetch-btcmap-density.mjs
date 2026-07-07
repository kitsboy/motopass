#!/usr/bin/env node
/** Pre-fetch BTC Map merchant counts per MotoPass jurisdiction → public/data/btcmap-density.json */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const API = process.env.VITE_BTCMAP_API_URL || 'https://api.btcmap.org'
const OUT_DIR = resolve(__dirname, '../public/data')
const OUT_FILE = resolve(OUT_DIR, 'btcmap-density.json')

/** Mirrors src/data/programCoords.ts — keep in sync */
const PROGRAM_COORDS = {
  'El Salvador': { lat: 13.6929, lon: -89.2182, radiusKm: 80 },
  'Central African Republic': { lat: 4.3947, lon: 18.5582, radiusKm: 60 },
  Uruguay: { lat: -34.9011, lon: -56.1645, radiusKm: 50 },
  Bolivia: { lat: -16.4897, lon: -68.1193, radiusKm: 40 },
  'St. Kitts and Nevis': { lat: 17.3026, lon: -62.7177, radiusKm: 25 },
  'Antigua and Barbuda': { lat: 17.1274, lon: -61.8468, radiusKm: 25 },
  Dominica: { lat: 15.3010, lon: -61.3881, radiusKm: 25 },
  'UAE (Dubai / Abu Dhabi)': { lat: 25.2048, lon: 55.2708, radiusKm: 60 },
  Switzerland: { lat: 46.9480, lon: 7.4474, radiusKm: 50 },
  Singapore: { lat: 1.3521, lon: 103.8198, radiusKm: 35 },
  Portugal: { lat: 38.7223, lon: -9.1393, radiusKm: 50 },
  Malta: { lat: 35.8989, lon: 14.5146, radiusKm: 20 },
  Panama: { lat: 8.9824, lon: -79.5199, radiusKm: 40 },
  Georgia: { lat: 41.7151, lon: 44.8271, radiusKm: 40 },
  Paraguay: { lat: -25.2637, lon: -57.5759, radiusKm: 40 },
  'Costa Rica': { lat: 9.9281, lon: -84.0907, radiusKm: 45 },
  'Hong Kong': { lat: 22.3193, lon: 114.1694, radiusKm: 25 },
  Thailand: { lat: 13.7563, lon: 100.5018, radiusKm: 50 },
  Mexico: { lat: 19.4326, lon: -99.1332, radiusKm: 60 },
  Cyprus: { lat: 35.1856, lon: 33.3823, radiusKm: 35 },
  Greece: { lat: 37.9838, lon: 23.7275, radiusKm: 50 },
  Vanuatu: { lat: -17.7333, lon: 168.3273, radiusKm: 30 },
  Turkey: { lat: 41.0082, lon: 28.9784, radiusKm: 50 },
  Mauritius: { lat: -20.1609, lon: 57.5012, radiusKm: 30 },
  Seychelles: { lat: -4.6191, lon: 55.4513, radiusKm: 20 },
  Brazil: { lat: -15.7939, lon: -47.8828, radiusKm: 60 },
  Argentina: { lat: -34.6037, lon: -58.3816, radiusKm: 50 },
  Chile: { lat: -33.4489, lon: -70.6693, radiusKm: 45 },
  Colombia: { lat: 4.7110, lon: -74.0721, radiusKm: 50 },
  'St. Lucia': { lat: 14.0101, lon: -60.9875, radiusKm: 20 },
  Grenada: { lat: 12.0564, lon: -61.7485, radiusKm: 20 },
  Barbados: { lat: 13.1939, lon: -59.5432, radiusKm: 20 },
  Bahamas: { lat: 25.0343, lon: -77.3963, radiusKm: 30 },
  Belize: { lat: 17.2510, lon: -88.7590, radiusKm: 30 },
  Cambodia: { lat: 11.5564, lon: 104.9282, radiusKm: 40 },
  Philippines: { lat: 14.5995, lon: 120.9842, radiusKm: 50 },
  Malaysia: { lat: 3.1390, lon: 101.6869, radiusKm: 45 },
  Indonesia: { lat: -6.2088, lon: 106.8456, radiusKm: 55 },
  Japan: { lat: 35.6762, lon: 139.6503, radiusKm: 50 },
  'New Zealand': { lat: -41.2865, lon: 174.7762, radiusKm: 45 },
  Ireland: { lat: 53.3498, lon: -6.2603, radiusKm: 45 },
  Spain: { lat: 40.4168, lon: -3.7038, radiusKm: 55 },
  Italy: { lat: 41.9028, lon: 12.4964, radiusKm: 55 },
  Latvia: { lat: 56.9496, lon: 24.1052, radiusKm: 35 },
  Estonia: { lat: 59.4370, lon: 24.7536, radiusKm: 35 },
  Bulgaria: { lat: 42.6977, lon: 23.3219, radiusKm: 40 },
  Croatia: { lat: 45.8150, lon: 15.9819, radiusKm: 40 },
  Gibraltar: { lat: 36.1408, lon: -5.3536, radiusKm: 10 },
  'Cayman Islands': { lat: 19.2869, lon: -81.3674, radiusKm: 15 },
  Andorra: { lat: 42.5063, lon: 1.5218, radiusKm: 15 },
}

function densityTier(count) {
  if (count >= 20) return 'dense'
  if (count >= 5) return 'moderate'
  return 'sparse'
}

function densityScore(count, radiusKm) {
  const perKm = count / Math.max(radiusKm, 1)
  return Math.min(100, Math.round(perKm * 40))
}

async function fetchCount(name, { lat, lon, radiusKm }) {
  const q = new URLSearchParams({ lat: String(lat), lon: String(lon), radius_km: String(radiusKm) })
  const res = await fetch(`${API}/v4/places/search/?${q}`)
  if (!res.ok) throw new Error(`${name}: ${res.status}`)
  const places = await res.json()
  const count = Array.isArray(places) ? places.length : 0
  return { count, tier: densityTier(count), score: densityScore(count, radiusKm) }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const entries = Object.entries(PROGRAM_COORDS)
  const density = { generatedAt: new Date().toISOString(), programs: {} }

  for (const [name, coord] of entries) {
    try {
      density.programs[name] = await fetchCount(name, coord)
      process.stdout.write(`✓ ${name}: ${density.programs[name].count}\n`)
    } catch (err) {
      density.programs[name] = { count: 0, tier: 'sparse', score: 0, error: String(err.message) }
      process.stderr.write(`✗ ${name}: ${err.message}\n`)
    }
    await new Promise((r) => setTimeout(r, 120))
  }

  writeFileSync(OUT_FILE, JSON.stringify(density, null, 2))
  console.log(`Wrote ${OUT_FILE}`)
}

main().catch((e) => { console.error(e); process.exit(1) })