#!/usr/bin/env node
/**
 * Rebuild public/data/source-monitor.json from the catalog watch census.
 * Does not fetch. Does not rewrite research/countries.json or last_checked.
 *
 * Run: node scripts/sync-source-monitor.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncSourceMonitor } from './lib/source-monitor-sync.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = resolve(root, 'research/countries.json')
const monitorPath = resolve(root, 'public/data/source-monitor.json')

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
const existing = JSON.parse(readFileSync(monitorPath, 'utf8'))
const next = syncSourceMonitor(catalog, existing, new Date())
writeFileSync(monitorPath, `${JSON.stringify(next, null, 2)}\n`)

const portugal = next.by_country.find(country => country.name === 'Portugal')
const uruguay = next.by_country.find(country => country.name === 'Uruguay')
console.log(
  `source-monitor synced · countries ${next.by_country.length} · urls ${next.total_urls} · ok ${next.ok} · changed ${next.changed} · unreachable ${next.unreachable} · blocked ${next.cloudflare_blocked} · generated_at ${next.generated_at} · portugal_changed ${portugal?.changed === true} · uruguay_changed ${uruguay?.changed === true}`,
)
