#!/usr/bin/env node
/**
 * Verify production React app actually mounts (not poisoned CDN cache).
 * Usage: node scripts/verify-live-app.mjs [baseUrl]
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { saltToBuildId } from './lib/parse-live-index.mjs'

const base = (process.argv[2] ?? 'https://motopass.giveabit.io').replace(/\/$/, '')
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const buildInfo = readFileSync(resolve(root, 'src/lib/buildInfo.ts'), 'utf8')
const localBuildId = buildInfo.match(/BUILD_ID\s*=\s*'([^']+)'/)?.[1]
if (!localBuildId) {
  console.error('FAIL: could not parse BUILD_ID from src/lib/buildInfo.ts')
  process.exit(1)
}

const distHtml = readFileSync(resolve(root, 'dist/index.html'), 'utf8')
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

const footerBuild = page.locator('[data-build-version]')
await footerBuild.scrollIntoViewIfNeeded().catch(() => {})
const footerText = (await footerBuild.textContent().catch(() => ''))?.trim() ?? ''
const footerBuildOk = footerText.includes(localBuildId)

await page.setViewportSize({ width: 390, height: 844 })
await footerBuild.scrollIntoViewIfNeeded().catch(() => {})

const scrollMetrics = await page.evaluate(() => {
  const footerEl = document.querySelector('footer.footer-glass')
  const navEl = document.querySelector('.mobile-nav-glass')
  const scrollHeight = document.documentElement.scrollHeight
  const bodyOffsetHeight = document.body.offsetHeight
  const voidPx = scrollHeight - bodyOffsetHeight
  let gapBelowDocument = voidPx
  if (footerEl && navEl) {
    const navRect = navEl.getBoundingClientRect()
    const navDocBottom = navRect.bottom + window.scrollY
    gapBelowDocument = scrollHeight - navDocBottom
  }
  return {
    scrollHeight,
    bodyOffsetHeight,
    voidPx,
    gapBelowDocument,
  }
})

const artifactDir = resolve(root, 'artifacts')
mkdirSync(artifactDir, { recursive: true })
const screenshotPath = resolve(artifactDir, 'footer-mobile-gap-live.png')
await page.locator('footer.footer-glass').screenshot({ path: screenshotPath }).catch(() => {})
writeFileSync(
  resolve(artifactDir, 'scroll-metrics-live.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), site: base, ...scrollMetrics }, null, 2)}\n`,
)

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
if (!footerBuildOk) {
  console.error(`FAIL: footer BUILD "${footerText}" does not match local ${localBuildId}`)
  process.exit(1)
}
if (scrollMetrics.voidPx >= 16) {
  console.error(
    `FAIL: scroll void ${scrollMetrics.voidPx}px (scrollHeight ${scrollMetrics.scrollHeight} − offsetHeight ${scrollMetrics.bodyOffsetHeight})`,
  )
  process.exit(1)
}

const res = await fetch(jsUrl, { cache: 'no-store', headers: { Accept: '*/*' } })
const body = await res.text()
if (!res.ok || body.trimStart().startsWith('<')) {
  console.error(`FAIL: ${jsUrl} HTTP ${res.status} or HTML body`)
  process.exit(1)
}

const saltFromBundle = jsPath.match(/-(\d{8}-\d+)\.js$/)?.[1]
const bundleBuildId = saltFromBundle ? (saltToBuildId(saltFromBundle) ?? saltFromBundle) : null
if (bundleBuildId && bundleBuildId !== localBuildId) {
  console.error(`FAIL: live bundle BUILD ${bundleBuildId} ≠ local ${localBuildId}`)
  process.exit(1)
}

console.log(`OK ${base}/ — main visible, footer BUILD ${localBuildId}, ${jsUrl} (${body.length} bytes)`)
console.log(
  `OK scroll metrics — void ${scrollMetrics.voidPx}px, gapBelowDocument ${scrollMetrics.gapBelowDocument}px`,
)
console.log(`OK footer screenshot stub → ${screenshotPath}`)