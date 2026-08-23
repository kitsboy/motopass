// Batch runner: measure all MotoPass pages mobile+desktop, compact output.
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = 'https://motopass.giveabit.io'
const PAGES = ['/', '/programs', '/compare', '/simulator', '/portfolio', '/vault', '/btcmap', '/distressed', '/apply', '/trust']
const VIEWPORTS = [
  { width: 390, height: 844, label: 'mobile' },
  { width: 1280, height: 800, label: 'desktop' },
]

async function measure(page, viewport, label, base) {
  const browser = await chromium.launch({ executablePath: '/snap/bin/chromium', args: ['--no-sandbox', '--disable-gpu'] })
  const ctx = await browser.newContext({
    viewport,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  })
  const pg = await ctx.newPage()
  await pg.addInitScript(() => {
    window.__perf = { fcp: null, lcp: null, cls: 0, clsEntries: [], longTasks: [] }
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__perf.fcp = e.startTime }).observe({ type: 'paint', buffered: true })
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__perf.cls += e.value; window.__perf.clsEntries.push({ v: e.value, t: Math.round(e.startTime) }) } }).observe({ type: 'layout-shift', buffered: true })
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.longTasks.push({ d: Math.round(e.duration), t: Math.round(e.startTime) }) }).observe({ type: 'longtask', buffered: true })
    } catch (e) {}
  })

  const reqs = { total: 0, flagcdn: 0, img: 0, js: [], json: 0, video: 0 }
  pg.on('request', (r) => {
    const u = r.url()
    reqs.total++
    if (u.includes('flagcdn.com')) reqs.flagcdn++
    if (/\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/.test(u)) reqs.img++
    if (u.endsWith('.js') || u.includes('.js?')) reqs.js.push(u)
    if (u.endsWith('.json') || u.includes('.json?')) reqs.json++
    if (/\.(mp4|webm)(\?|$)/.test(u)) reqs.video++
  })

  const start = Date.now()
  await pg.goto(base + page, { waitUntil: 'load', timeout: 40000 })
  await pg.waitForTimeout(1500)
  const loadMs = Date.now() - start
  const fpReqs = { total: reqs.total, flagcdn: reqs.flagcdn, img: reqs.img, video: reqs.video, json: reqs.json }

  const data = await pg.evaluate(() => {
    const perf = window.__perf
    let animating = 0
    for (const el of document.querySelectorAll('*')) {
      const a = el.getAnimations ? el.getAnimations() : []
      if (a.some((x) => x.playState === 'running')) animating++
    }
    const lazyImgs = [...document.querySelectorAll('img[loading="lazy"]')].length
    return {
      fcp: perf.fcp ? Math.round(perf.fcp) : null,
      lcp: perf.lcp ? Math.round(perf.lcp) : null,
      cls: perf.cls, clsEntries: perf.clsEntries,
      longTaskCount: perf.longTasks.length,
      longTaskTotalMs: perf.longTasks.reduce((a, b) => a + b.d, 0),
      longTaskMaxMs: perf.longTasks.reduce((a, b) => Math.max(a, b.d), 0),
      animating, lazyImgs,
      videos: document.querySelectorAll('video').length,
      canvases: document.querySelectorAll('canvas').length,
      scrollH: document.body.scrollHeight,
    }
  })

  // scroll to bottom to trigger lazy loads, then capture post-scroll requests
  await pg.evaluate(async () => {
    const step = () => new Promise((r) => setTimeout(r, 16))
    const target = document.body.scrollHeight - window.innerHeight
    for (let i = 0; i < 60 && target > 0; i++) { window.scrollBy(0, Math.max(target / 60, 1)); await step() }
    await new Promise((r) => setTimeout(r, 1200))
  })
  const afterScroll = { total: reqs.total, flagcdn: reqs.flagcdn, img: reqs.img, video: reqs.video, json: reqs.json }

  const jsCount = new Set(reqs.js.map((u) => u.split('?')[0])).size
  const jsBytes = await pg.evaluate(() => {
    const p = performance.getEntriesByType('resource').filter((e) => e.name.includes('.js'))
    return p.reduce((a, e) => a + (e.transferSize || 0), 0)
  })

  await browser.close()
  return { page, viewport: label, loadMs, fcp: data.fcp, lcp: data.lcp, cls: +data.cls.toFixed(4), clsEntries: data.clsEntries, longTaskCount: data.longTaskCount, longTaskTotalMs: data.longTaskTotalMs, longTaskMaxMs: data.longTaskMaxMs, animating: data.animating, lazyImgs: data.lazyImgs, videos: data.videos, canvases: data.canvases, scrollH: data.scrollH, fpReqs, afterScroll, jsUnique: jsCount, jsBytes }
}

const results = []
for (const vp of VIEWPORTS) {
  for (const p of PAGES) {
    results.push(await measure(p, vp, vp.label, BASE))
    process.stdout.write(`.`)
  }
}
process.stdout.write('\n')
const report = { measured_at: new Date().toISOString(), build: process.env.BUILD || 'unknown', base: BASE, results }
writeFileSync(process.env.MEASURE_OUT || '/tmp/mp-before.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
