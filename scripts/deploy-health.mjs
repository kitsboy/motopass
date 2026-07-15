#!/usr/bin/env node
/**
 * Lightweight live deploy health — no Playwright.
 * Prints BUILD_ID from live index.html and checks main bundle is JS (not HTML poison).
 * Usage: node scripts/deploy-health.mjs [baseUrl]
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseLiveIndex, saltToBuildId } from './lib/parse-live-index.mjs'

const base = (process.argv[2] ?? 'https://motopass.giveabit.io').replace(/\/$/, '')
const __dirname = dirname(fileURLToPath(import.meta.url))

let localBuildId = null
try {
  const info = readFileSync(resolve(__dirname, '../src/lib/buildInfo.ts'), 'utf8')
  localBuildId = info.match(/BUILD_ID\s*=\s*'([^']+)'/)?.[1] ?? null
} catch {
  /* optional local compare */
}

let html
try {
  const res = await fetch(`${base}/`, { cache: 'no-store', headers: { Accept: 'text/html' } })
  if (!res.ok) {
    console.error(`FAIL: ${base}/ returned HTTP ${res.status}`)
    process.exit(1)
  }
  html = await res.text()
} catch (err) {
  console.error(`FAIL: could not fetch ${base}/ — ${err.message}`)
  process.exit(1)
}

const { buildSalt, mainBundlePath } = parseLiveIndex(html)
if (!buildSalt) {
  console.error('FAIL: could not parse BUILD_ID (salt) from live index.html')
  process.exit(1)
}
const liveBuildId = saltToBuildId(buildSalt) ?? buildSalt
console.log(`LIVE BUILD_ID: ${liveBuildId}`)

if (!mainBundlePath) {
  console.error('FAIL: could not find main bundle path in live index.html')
  process.exit(1)
}

const jsUrl = `${base}${mainBundlePath}`
let bundleRes
try {
  bundleRes = await fetch(jsUrl, { cache: 'no-store', headers: { Accept: '*/*' } })
} catch (err) {
  console.error(`FAIL: could not fetch ${jsUrl} — ${err.message}`)
  process.exit(1)
}

const body = await bundleRes.text()
if (!bundleRes.ok) {
  console.error(`FAIL: ${jsUrl} HTTP ${bundleRes.status}`)
  process.exit(1)
}
if (body.trimStart().startsWith('<')) {
  console.error(`FAIL: ${jsUrl} returned HTML (CDN cache poison) — expected JavaScript`)
  process.exit(1)
}
console.log(`OK bundle ${mainBundlePath} (${body.length} bytes, application/javascript)`)

if (localBuildId) {
  if (localBuildId === liveBuildId) {
    console.log(`OK local BUILD_ID matches live (${localBuildId})`)
  } else {
    console.warn(`WARN: local BUILD_ID ${localBuildId} ≠ live ${liveBuildId}`)
  }
}