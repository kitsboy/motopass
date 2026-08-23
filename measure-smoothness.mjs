// MotoPass smoothness verification harness — real before/after measurement
// Usage: node measure.mjs <url> [viewport-width] [viewport-height] [label]
// Captures: FCP, LCP, CLS, total request count, flagcdn requests, image requests,
// JS bytes, per-route bundle check, heavy-element deferral, scroll-smoothness proxy.
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const URL = process.env.MEASURE_URL || process.argv[2] || 'https://motopass.giveabit.io/'
const W = parseInt(process.argv[3] || '390', 10)
const H = parseInt(process.argv[4] || '844', 10)
const LABEL = process.argv[5] || `mobile-${W}`

const OUT = process.env.MEASURE_OUT || '/tmp/motopass-measure.json'

async function measure(viewport, label) {
  const browser = await chromium.launch({
    executablePath: '/snap/bin/chromium',
    args: ['--no-sandbox', '--disable-gpu'],
  })
  const ctx = await browser.newContext({
    viewport,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  })
  const page = await ctx.newPage()
  const perf = { fcp: null, lcp: null, cls: 0, clsEntries: [] }
  await page.addInitScript(() => {
    window.__perf = { fcp: null, lcp: null, cls: 0, clsEntries: [] }
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.name === 'first-contentful-paint') window.__perf.fcp = e.startTime
          if (e.name === 'largest-contentful-paint') window.__perf.lcp = e.startTime
        }
      }).observe({ type: 'paint', buffered: true })
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (!e.hadRecentInput) {
            window.__perf.cls += e.value
            window.__perf.clsEntries.push({ v: e.value, t: Math.round(e.startTime) })
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.entryType === 'largest-contentful-paint') window.__perf.lcp = e.startTime
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    } catch (e) {}
  })

  // Track network requests
  const reqs = { total: 0, flagcdn: 0, img: 0, js: [], json: 0, video: 0, thirdParty: 0 }
  page.on('request', (r) => {
    const u = r.url()
    reqs.total++
    if (u.includes('flagcdn.com')) reqs.flagcdn++
    if (/\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/.test(u)) reqs.img++
    if (u.endsWith('.js') || u.includes('.js?')) reqs.js.push(u)
    if (u.endsWith('.json') || u.includes('.json?')) reqs.json++
    if (/\.(mp4|webm)(\?|$)/.test(u)) reqs.video++
    try {
      const host = new URL(u).host
      const allowed = new Set(['motopass.giveabit.io', 'satohash.io'])
      if (!allowed.has(host) && !host.endsWith('.giveabit.io') && !host.endsWith('.satohash.io')) reqs.thirdParty++
    } catch (e) {}
  })

  const start = Date.now()
  await page.goto(URL, { waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(2500)
  const totalMs = Date.now() - start

  const data = await page.evaluate(() => {
    const perf = window.__perf
    // animating elements
    let animating = 0
    for (const el of document.querySelectorAll('*')) {
      const a = el.getAnimations ? el.getAnimations() : []
      if (a.some((x) => x.playState === 'running')) animating++
    }
    // IntersectionObserver-driven lazy images present
    const lazyImgs = [...document.querySelectorAll('img[loading="lazy"]')].length
    const lazyImgsDecode = [...document.querySelectorAll('img[decoding="async"]')].length
    const videos = document.querySelectorAll('video').length
    const canvases = document.querySelectorAll('canvas').length
    const preloads = [...document.querySelectorAll('link[rel="preload"]')].map((l) => l.getAttribute('href'))
    // check for iframes / intersection observers
    return {
      fcp: perf.fcp, lcp: perf.lcp, cls: perf.cls, clsEntries: perf.clsEntries,
      animating, lazyImgs, lazyImgsDecode, videos, canvases,
      scrollH: document.body.scrollHeight, title: document.title,
    }
  })

  // Scroll smoothness proxy: measure max frame time during a scripted scroll + jump
  // captured via rAF deltas. Higher max gap = jankier scroll.
  const scroll = await page.evaluate(() => new Promise((resolve) => {
    const gaps = []
    let last = performance.now()
    let rafId
    const loop = () => {
      const now = performance.now()
      gaps.push(now - last)
      last = now
      rafId = requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
    const scroller = async () => {
      const target = document.body.scrollHeight
      const steps = 40
      for (let i = 0; i < steps; i++) {
        window.scrollBy(0, target / steps)
        await new Promise((r) => setTimeout(r, 30))
      }
      await new Promise((r) => setTimeout(r, 300))
      cancelAnimationFrame(rafId)
      gaps.shift()
      gaps.sort((a, b) => b - a)
      // p95 + max frame gap
      const idx = Math.floor(gaps.length * 0.95)
      resolve({ p95: gaps[Math.min(idx, gaps.length - 1)], max: gaps[0], frames: gaps.length, avg: gaps.reduce((a, b) => a + b, 0) / gaps.length })
    }
    scroller()
  }))

  // Capture onload JS bundle count + total JS bytes fetched
  const bundles = await page.evaluate(() => {
    const p = performance.getEntriesByType('resource').filter((e) => e.name.includes('.js'))
    return { count: p.length, bytes: p.reduce((a, e) => a + (e.transferSize || 0), 0) }
  })

  await browser.close()
  return {
    label, url: URL, totalMs, fcp: data.fcp, lcp: data.lcp, cls: data.cls,
    clsEntries: data.clsEntries, animating: data.animating,
    lazyImgs: data.lazyImgs, lazyImgsDecode: data.lazyImgsDecode,
    videos: data.videos, canvases: data.canvases, scrollH: data.scrollH,
    title: data.title, scroll, reqs, jsBundles: bundles,
  }
}

const results = []
results.push(await measure({ width: W, height: H }, LABEL))
if (W < 500) {
  results.push(await measure({ width: 1280, height: 800 }, 'desktop-1280'))
}
const report = { measured_at: new Date().toISOString(), url: URL, results }
writeFileSync(OUT, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
