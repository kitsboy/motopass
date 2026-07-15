#!/usr/bin/env node
/**
 * Purge Cloudflare cache for current dist asset URLs.
 * Requires CLOUDFLARE_API_TOKEN with Zone.Cache Purge permission.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ZONE_ID = '52f656cdb5d38cfab3a34959331d63a1'
const BASE = 'https://motopass.giveabit.io'
const token = process.env.CLOUDFLARE_API_TOKEN
if (!token) {
  console.warn('SKIP purge: CLOUDFLARE_API_TOKEN not set')
  process.exit(0)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(resolve(__dirname, '../dist/index.html'), 'utf8')
const assetsDir = resolve(__dirname, '../dist/assets')
const diskAssets = readdirSync(assetsDir).map(f => `${BASE}/assets/${f}`)
const htmlAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => `${BASE}${m[1]}`)
const assets = [...new Set([`${BASE}/`, `${BASE}/index.html`, ...htmlAssets, ...diskAssets])]

async function purge(body) {
  return fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(r => r.json())
}

let data = await purge({ files: assets })
if (!data.success) {
  console.warn('WARN: file purge failed, trying purge_everything:', data.errors ?? data)
  data = await purge({ purge_everything: true })
}
if (!data.success) {
  console.warn('WARN: cache purge failed:', data.errors ?? data)
  process.exit(0)
}
console.log(`Purged Cloudflare cache (${assets.length} file URLs listed)`)