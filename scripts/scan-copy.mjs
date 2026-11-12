/**
 * Crawl every route and every locale looking for two things:
 *   1. unrendered translation placeholders — "{count}", "{date}", "{fresh}" —
 *      that reached the screen because a component used t() where it needed
 *      formatT();
 *   2. the phrases Cam asked to remove ("Truth You Can Verify",
 *      "Bitcoin-verified"), and every remaining claim of verification.
 *
 * Usage: node scripts/scan-copy.mjs [baseUrl]
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:4174'
const LOCALES = ['en', 'de', 'es', 'fr', 'it', 'ja', 'pt', 'sw', 'ar']

const ROUTES = [
  '/',
  '/programs',
  '/compare',
  '/simulator',
  '/proof',
  '/proof?tab=sources',
  '/proof?tab=vault',
  '/proof?tab=tools',
  '/verify',
  '/apply',
  '/register',
  '/btcmap',
  '/tools/receipt',
  '/dashboard',
  '/profile',
]

const PLACEHOLDER = /\{[a-zA-Z][a-zA-Z0-9_.]*\}/
const BANNED = [
  'Truth You Can Verify',
  'Bitcoin-verified',
  'Bitcoin-verified data',
  'Honesty by design',
  'honesty by design',
  'The honesty promise',
  'the honesty promise',
  'Nothing here is invented at render time',
  'Bitcoin-anchored',
  'Bitcoin anchored',
  'guarantee',
  'guaranteed',
]
// Single words Cam asked to be accounted for. These are not automatically wrong
// — "Verify proof" is a button that opens a real proof — but every hit is
// listed so each one can be justified or changed.
const WORDS = ['verify', 'verified', 'traces', 'anchored']

const browser = await chromium.launch()
const findings = { placeholders: [], banned: [], words: [], claims: [] }

for (const locale of LOCALES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(loc => {
    localStorage.setItem('motopass-locale', loc)
    localStorage.setItem('i18nextLng', loc)
    localStorage.setItem('lang', loc)
  }, locale)
  const page = await ctx.newPage()
  for (const route of ROUTES) {
    const url = `${BASE}${route}${route.includes('?') ? '&' : '?'}lang=${locale}`
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(600)
      const text = await page.evaluate(() => document.body.innerText)
      const hits = text.match(new RegExp(PLACEHOLDER.source, 'g'))
      if (hits) findings.placeholders.push({ locale, route, hits: [...new Set(hits)] })
      for (const phrase of BANNED) {
        if (text.toLowerCase().includes(phrase.toLowerCase())) findings.banned.push({ locale, route, phrase })
      }
      for (const w of WORDS) {
        const re = new RegExp(`\\b${w}\\b`, 'gi')
        const hits = text.match(re)
        if (hits) findings.words.push({ locale, route, word: w, n: hits.length })
      }
      for (const line of text.split('\n')) {
        if (/verif|official source|traces|sourced/i.test(line) && line.trim().length < 160) {
          findings.claims.push({ locale, route, line: line.trim() })
        }
      }
    } catch (err) {
      findings.claims.push({ locale, route, line: `LOAD FAILED: ${String(err).slice(0, 80)}` })
    }
  }
  await ctx.close()
}
await browser.close()

console.log('PLACEHOLDERS', findings.placeholders.length)
for (const p of findings.placeholders) console.log('  ', p.locale, p.route, p.hits.join(' '))
console.log('BANNED PHRASES', findings.banned.length)
for (const b of findings.banned.slice(0, 20)) console.log('  ', b.locale, b.route, b.phrase)
const wordTotals = findings.words.reduce((acc, w) => ({ ...acc, [w.word]: (acc[w.word] ?? 0) + w.n }), {})
const wordRoutes = {}
for (const w of findings.words) (wordRoutes[w.word] ??= new Set()).add(w.route)
console.log('WORD TOTALS', JSON.stringify(wordTotals))
for (const [w, routes] of Object.entries(wordRoutes)) console.log(`  ${w}: ${[...routes].join(' ')}`)
console.log('CLAIM LINES', findings.claims.length)
const uniq = new Map()
for (const c of findings.claims) uniq.set(c.line, (uniq.get(c.line) ?? 0) + 1)
for (const [line, n] of uniq) console.log(`  [${n}] ${line}`)
fs.writeFileSync('research/copy-scan.json', JSON.stringify(findings, null, 1))
