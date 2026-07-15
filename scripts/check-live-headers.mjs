#!/usr/bin/env node
/**
 * Assert production index.html returns no-store (or no-cache) headers (CDN poison defense).
 * Usage: node scripts/check-live-headers.mjs [baseUrl]
 */
const base = (process.argv[2] ?? 'https://motopass.giveabit.io').replace(/\/$/, '')
const url = `${base}/`

let res
try {
  res = await fetch(url, { method: 'HEAD', cache: 'no-store', redirect: 'follow' })
} catch (err) {
  console.error(`FAIL: could not HEAD ${url} — ${err.message}`)
  process.exit(1)
}

if (!res.ok) {
  console.error(`FAIL: ${url} returned HTTP ${res.status}`)
  process.exit(1)
}

const cacheControl = res.headers.get('cache-control') ?? ''
const cdnCacheControl = res.headers.get('cdn-cache-control') ?? ''

function hasNoStore(value) {
  return /no-store/i.test(value)
}

let ok = true
if (!hasNoStore(cacheControl)) {
  console.error(`FAIL: Cache-Control missing no-store — got "${cacheControl || '(empty)'}"`)
  ok = false
}
if (cdnCacheControl && !hasNoStore(cdnCacheControl)) {
  console.error(`FAIL: CDN-Cache-Control missing no-store — got "${cdnCacheControl}"`)
  ok = false
}

if (!ok) process.exit(1)

console.log(`OK ${url}`)
console.log(`  Cache-Control: ${cacheControl}`)
if (cdnCacheControl) console.log(`  CDN-Cache-Control: ${cdnCacheControl}`)