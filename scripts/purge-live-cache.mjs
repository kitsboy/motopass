#!/usr/bin/env node
/**
 * Purge Cloudflare cache for current dist asset URLs.
 *
 * Required env: CLOUDFLARE_API_TOKEN
 *
 * Token scopes (Custom Token at https://dash.cloudflare.com/profile/api-tokens):
 *   - Zone · Cache Purge · Purge          (required — without this, purge returns 403)
 *   - Zone · Zone · Read                  (recommended)
 *   - Account · Cloudflare Pages · Edit   (wrangler deploy only; not used by this script)
 *
 * Quick template: "Purge Cache" on zone motopass.giveabit.io, then verify Purge permission.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ZONE_ID = '52f656cdb5d38cfab3a34959331d63a1'
const BASE = 'https://motopass.giveabit.io'
const token = process.env.CLOUDFLARE_API_TOKEN
if (!token) {
  console.warn('SKIP purge: CLOUDFLARE_API_TOKEN not set (export token with Zone.Cache Purge scope)')
  process.exit(0)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const distHtml = resolve(__dirname, '../dist/index.html')
const assetsDir = resolve(__dirname, '../dist/assets')

if (!existsSync(distHtml)) {
  console.error('FAIL purge: dist/index.html missing — run npm run build first')
  process.exit(1)
}
if (!existsSync(assetsDir)) {
  console.error('FAIL purge: dist/assets/ missing — run npm run build first')
  process.exit(1)
}

const html = readFileSync(distHtml, 'utf8')
const diskAssets = readdirSync(assetsDir).map(f => `${BASE}/assets/${f}`)
const htmlAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => `${BASE}${m[1]}`)
const assets = [...new Set([`${BASE}/`, `${BASE}/index.html`, ...htmlAssets, ...diskAssets])]

function formatCfErrors(errors) {
  if (!errors?.length) return 'unknown Cloudflare API error'
  return errors.map(e => `[${e.code ?? '?'}] ${e.message ?? JSON.stringify(e)}`).join('; ')
}

async function purge(body) {
  let res
  try {
    res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error(`FAIL purge: network error calling Cloudflare API — ${err.message}`)
    process.exit(1)
  }

  if (res.status === 401) {
    console.error('FAIL purge: HTTP 401 — CLOUDFLARE_API_TOKEN invalid or expired')
    process.exit(1)
  }
  if (res.status === 403) {
    console.error(
      'FAIL purge: HTTP 403 — token lacks Zone.Cache Purge permission. ' +
        'Create a token with Zone · Cache Purge · Purge for this zone.',
    )
    process.exit(1)
  }

  let data
  try {
    data = await res.json()
  } catch {
    console.error(`FAIL purge: Cloudflare returned HTTP ${res.status} with non-JSON body`)
    process.exit(1)
  }
  return data
}

let data = await purge({ files: assets })
if (!data.success) {
  console.warn(`WARN: file purge failed (${formatCfErrors(data.errors)}), trying purge_everything…`)
  data = await purge({ purge_everything: true })
}
if (!data.success) {
  console.warn(`WARN: cache purge failed — ${formatCfErrors(data.errors)}`)
  console.warn('WARN: deploy will continue; run npm run verify:live after deploy or purge cache in CF dashboard')
  process.exit(0)
}
console.log(`Purged Cloudflare cache (${assets.length} file URLs listed)`)