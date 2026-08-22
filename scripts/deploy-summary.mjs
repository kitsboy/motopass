#!/usr/bin/env node
/**
 * Emit deploy summary JSON with local + live BUILD and health probes.
 * Usage: node scripts/deploy-summary.mjs [baseUrl] [--out path.json] [--fresh]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { parseLiveIndex, saltToBuildId } from './lib/parse-live-index.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const args = process.argv.slice(2)
const outIdx = args.indexOf('--out')
const outPath = outIdx === -1 ? null : args[outIdx + 1]
const forceFresh = args.includes('--fresh')
const base = (args.find(a => !a.startsWith('--') && a !== outPath) ?? 'https://motopass.giveabit.io').replace(
  /\/$/,
  '',
)

function readLocalBuildId() {
  const info = readFileSync(resolve(root, 'src/lib/buildInfo.ts'), 'utf8')
  return info.match(/BUILD_ID\s*=\s*'([^']+)'/)?.[1] ?? null
}

// index.html must revalidate-or-fetch on every request so new deploys
// propagate immediately. no-store, no-cache, must-revalidate, and max-age=0
// all satisfy that (Cloudflare Pages serves `public, max-age=0,
// must-revalidate` by default). A long-lived max-age without revalidation
// is the failure case — it would pin stale HTML after a deploy.
function cacheDirectiveOk(value) {
  return /no-store|no-cache|must-revalidate|max-age\s*=\s*0/i.test(value ?? '')
}

// Reuse the cached scroll probe (written by verify-live-app.mjs or this
// script) only while fresh — without a TTL a committed copy sat stale for
// weeks and deploy-summary kept reporting it. --fresh forces a real probe.
const TTL_SCROLL_CACHE_MS = 24 * 60 * 60 * 1000

async function readScrollMetrics(forceFresh) {
  const artifactPath = resolve(root, 'artifacts/scroll-metrics-live.json')
  if (!forceFresh && existsSync(artifactPath)) {
    try {
      const cached = JSON.parse(readFileSync(artifactPath, 'utf8'))
      const age = Date.now() - new Date(cached.generatedAt ?? NaN).getTime()
      if (Number.isFinite(age) && age >= 0 && age <= TTL_SCROLL_CACHE_MS) return cached
    } catch {
      /* corrupt or missing generatedAt — fall through to a fresh probe */
    }
  }

  const browser = await chromium.launch({ args: ['--disk-cache-size=1', '--media-cache-size=1'] })
  let metrics
  try {
    const page = await browser.newPage()
    await page.goto(`${base}/`, { waitUntil: 'load', timeout: 30000 })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.locator('footer.footer-glass').scrollIntoViewIfNeeded().catch(() => {})
    metrics = await page.evaluate(() => {
      const navEl = document.querySelector('.mobile-nav-glass')
      const scrollHeight = document.documentElement.scrollHeight
      const bodyOffsetHeight = document.body.offsetHeight
      const voidPx = scrollHeight - bodyOffsetHeight
      let gapBelowDocument = voidPx
      if (navEl) {
        const navRect = navEl.getBoundingClientRect()
        gapBelowDocument = scrollHeight - (navRect.bottom + window.scrollY)
      }
      return {
        scrollHeight,
        bodyOffsetHeight,
        voidPx,
        gapBelowDocument,
        scrollVoidOk: voidPx < 16,
      }
    })
  } finally {
    await browser.close()
  }
  // Persist so later runs reuse it within the TTL (same shape as
  // verify-live-app.mjs writes). Non-fatal if the write fails.
  try {
    writeFileSync(
      artifactPath,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), site: base, ...metrics }, null, 2)}\n`,
    )
  } catch {
    /* cache write is best-effort */
  }
  return metrics
}

const summary = {
  generatedAt: new Date().toISOString(),
  site: base,
  localBuildId: readLocalBuildId(),
  liveBuildId: null,
  buildMatch: null,
  bundleOk: null,
  headersOk: null,
  scrollMetrics: null,
  scrollVoidOk: null,
  health: 'unknown',
  errors: [],
}

try {
  const res = await fetch(`${base}/`, { cache: 'no-store', headers: { Accept: 'text/html' } })
  const cacheControl = res.headers.get('cache-control') ?? ''
  const cdnCacheControl = res.headers.get('cdn-cache-control') ?? ''
  summary.headersOk = res.ok && cacheDirectiveOk(cacheControl) && (!cdnCacheControl || cacheDirectiveOk(cdnCacheControl))
  if (!summary.headersOk) {
    summary.errors.push(
      `index.html headers: Cache-Control="${cacheControl}" CDN-Cache-Control="${cdnCacheControl || '(empty)'}"`,
    )
  }

  if (!res.ok) {
    summary.errors.push(`GET ${base}/ returned HTTP ${res.status}`)
    summary.health = 'fail'
  } else {
    const html = await res.text()
    const { buildSalt, mainBundlePath } = parseLiveIndex(html)
    summary.liveBuildId = buildSalt ? (saltToBuildId(buildSalt) ?? buildSalt) : null
    summary.buildMatch = summary.localBuildId != null && summary.liveBuildId === summary.localBuildId

    if (!mainBundlePath) {
      summary.errors.push('could not parse main bundle from live index.html')
      summary.bundleOk = false
    } else {
      const jsUrl = `${base}${mainBundlePath}`
      const bundleRes = await fetch(jsUrl, { cache: 'no-store', headers: { Accept: '*/*' } })
      const body = await bundleRes.text()
      summary.bundleOk = bundleRes.ok && !body.trimStart().startsWith('<')
      if (!summary.bundleOk) summary.errors.push(`${jsUrl} HTTP ${bundleRes.status} or HTML body`)
    }

    try {
      summary.scrollMetrics = await readScrollMetrics(forceFresh)
      summary.scrollVoidOk = summary.scrollMetrics.scrollVoidOk ?? summary.scrollMetrics.voidPx < 16
      if (!summary.scrollVoidOk) {
        summary.errors.push(
          `scroll void ${summary.scrollMetrics.voidPx}px (scrollHeight ${summary.scrollMetrics.scrollHeight} − offsetHeight ${summary.scrollMetrics.bodyOffsetHeight})`,
        )
      }
    } catch (err) {
      summary.errors.push(`scroll metrics probe failed: ${err.message}`)
      summary.scrollVoidOk = false
    }

    summary.health =
      summary.buildMatch && summary.bundleOk && summary.headersOk && summary.scrollVoidOk
        ? 'ok'
        : summary.bundleOk && summary.headersOk && summary.scrollVoidOk
          ? 'warn'
          : 'fail'
  }
} catch (err) {
  summary.errors.push(err.message)
  summary.health = 'fail'
}

const json = JSON.stringify(summary, null, 2)
if (outPath) {
  mkdirSync(dirname(resolve(outPath)), { recursive: true })
  writeFileSync(outPath, json + '\n', 'utf8')
  console.log(`Wrote ${outPath}`)
} else {
  console.log(json)
}

if (summary.health === 'fail') process.exit(1)