#!/usr/bin/env node
/**
 * Verify production React app actually mounts (not poisoned CDN cache).
 * Usage: node scripts/verify-live-app.mjs [baseUrl]
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const base = (process.argv[2] ?? 'https://motopass.giveabit.io').replace(/\/$/, '')
const __dirname = dirname(fileURLToPath(import.meta.url))
const distHtml = readFileSync(resolve(__dirname, '../dist/index.html'), 'utf8')
const jsMatch =
  distHtml.match(/import\("(\/assets\/index-[^"]+\.js)/) ??
  distHtml.match(/src="(\/assets\/index-[^"]+\.js)/)
if (!jsMatch) {
  console.error('FAIL: could not find main bundle in dist/index.html')
  process.exit(1)
}
const jsPath = jsMatch[1]
const jsUrl = `${base}${jsPath}`

const browser = await chromium.launch({
  args: ['--disk-cache-size=1', '--media-cache-size=1'],
})
const context = await browser.newContext({ bypassCSP: true })
const page = await context.newPage()
const poisoned = []

page.on('response', async res => {
  const url = res.url()
  if (!url.includes('/assets/')) return
  try {
    const body = await res.text()
    if (body.trimStart().startsWith('<')) {
      poisoned.push(url.replace(base, ''))
    }
  } catch {
    /* redirect */
  }
})

let pageError = null
page.on('pageerror', e => { pageError = e.message })

await page.goto(`${base}/`, { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(3000)
const mainVisible = await page.locator('main').isVisible().catch(() => false)
await browser.close()

if (poisoned.length) {
  console.error('FAIL: browser received HTML for assets (CDN cache poison):')
  for (const p of poisoned) console.error('  ', p)
  process.exit(1)
}
if (!mainVisible) {
  console.error('FAIL: React did not mount — <main> not visible')
  if (pageError) console.error('pageerror:', pageError)
  process.exit(1)
}

const res = await fetch(jsUrl, { cache: 'no-store', headers: { Accept: '*/*' } })
const body = await res.text()
if (!res.ok || body.trimStart().startsWith('<')) {
  console.error(`FAIL: ${jsUrl} HTTP ${res.status} or HTML body`)
  process.exit(1)
}

console.log(`OK ${base}/ — main visible, ${jsUrl} (${body.length} bytes)`)