#!/usr/bin/env node
/**
 * Runtime manifest writer — regenerates public/data/intel.json from
 * countries.json (freshness + watch state + proof anchors + recent changes)
 * and probes the Satohash API health for the `sweep.satohash_api` field.
 *
 * Usage: node scripts/write-intel.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIntel } from './update-freshness.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const intelPath = resolve(root, 'public/data/intel.json')
const API_BASE = (process.env.SATOHASH_API_URL || 'https://api.satohash.io').replace(/\/$/, '')

async function apiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      headers: { 'X-Satohash-Client': 'motopass-intel' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { status: 'down', http: res.status }
    const body = await res.json()
    return { status: body?.status === 'ok' ? 'up' : 'unknown', version: body?.details?.version ?? null }
  } catch {
    return { status: 'down' }
  }
}

async function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const health = await apiHealth()
  const intel = buildIntel(data, { satohashApi: health })
  mkdirSync(resolve(root, 'public/data'), { recursive: true })
  writeFileSync(intelPath, JSON.stringify(intel, null, 2) + '\n')
  console.log(
    `✓ intel.json written — ${intel.sweep.fresh} fresh / ${intel.sweep.watch} watch / ${intel.sweep.stale} stale · satohash ${health.status}`,
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
