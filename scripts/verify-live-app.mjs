#!/usr/bin/env node
/**
 * Verify production serves real JS (not poisoned index.html cache).
 * Usage: node scripts/verify-live-app.mjs [baseUrl]
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const base = (process.argv[2] ?? 'https://motopass.giveabit.io').replace(/\/$/, '')
const __dirname = dirname(fileURLToPath(import.meta.url))
const distHtml = readFileSync(resolve(__dirname, '../dist/index.html'), 'utf8')
const jsMatch = distHtml.match(/src="(\/assets\/index-[^"]+\.js)"/)
if (!jsMatch) {
  console.error('FAIL: could not find main bundle in dist/index.html')
  process.exit(1)
}
const jsUrl = `${base}${jsMatch[1]}`
const res = await fetch(jsUrl, { headers: { Accept: '*/*' } })
const body = await res.text()
if (!res.ok) {
  console.error(`FAIL: ${jsUrl} HTTP ${res.status}`)
  process.exit(1)
}
if (body.trimStart().startsWith('<')) {
  console.error(`FAIL: ${jsUrl} returned HTML (cache poison or redirect bug)`)
  console.error(body.slice(0, 120))
  process.exit(1)
}
if (!body.includes('__vite__mapDeps') && !body.includes('createRoot')) {
  console.error(`FAIL: ${jsUrl} does not look like a Vite bundle`)
  process.exit(1)
}
console.log(`OK ${jsUrl} (${body.length} bytes)`)