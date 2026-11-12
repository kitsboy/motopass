#!/usr/bin/env node
/**
 * Quote check: every claim must still be sayable by its own source.
 *
 * For each `claim_sources` entry in research/countries.json, open the URL in a
 * real browser (government portals are often JS-only or bot-gated, and a plain
 * fetch would fail them for the wrong reason), read the rendered text, and
 * check the quoted words are still on the page.
 *
 * A quote that has drifted off the page is worse than no source at all: it
 * looks like evidence. This fails the build.
 *
 *   node scripts/check-quotes.mjs            # check all
 *   node scripts/check-quotes.mjs --fix-miss # only print misses, no exit code
 */
import fs from 'node:fs'
import { chromium } from 'playwright'

const ROOT = new URL('..', import.meta.url).pathname
const corpus = JSON.parse(fs.readFileSync(`${ROOT}research/countries.json`, 'utf8'))

const normalise = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const flexible = quote =>
  new RegExp(escapeRe(normalise(quote)).replace(/[-\s]+/g, '[-\\s]+').replace(/\\\./g, '\\.?'), 'i')

const claims = []
for (const program of corpus.programs ?? corpus) {
  for (const [path, src] of Object.entries(program.claim_sources ?? {})) {
    if (!src?.url || !src?.quote) continue
    claims.push({ name: program.name, path, url: src.url, quote: src.quote, fetched: src.fetched })
  }
}

const browser = await chromium.launch({ args: ['--disable-http2'] })
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36',
})

const byUrl = new Map()
for (const c of claims) {
  if (!byUrl.has(c.url)) byUrl.set(c.url, [])
  byUrl.get(c.url).push(c)
}

let pass = 0
const fails = []
const unreachable = []
for (const [url, list] of byUrl) {
  let text = ''
  let err = ''
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForTimeout(2500)
      text = normalise(await page.evaluate(() => document.body?.innerText ?? ''))
      if (text.length > 200) {
        err = ''
        break
      }
      err = 'page rendered no text'
    } catch (e) {
      err = String(e.message || e).slice(0, 90)
      await page.waitForTimeout(1500)
    }
  }
  for (const c of list) {
    const ok = !err && flexible(c.quote).test(text)
    if (ok) {
      pass += 1
      console.log(`ok    ${c.name} ${c.path}`)
    } else if (err) {
      // The page could not be read from here. That is not a drifted quote, so it
      // is reported separately and does not fail the build — but it is printed.
      unreachable.push({ ...c, err })
      console.log(`SKIP  ${c.name} ${c.path} — ${err}`)
    } else {
      fails.push({ ...c, err: '' })
      console.log(`FAIL  ${c.name} ${c.path} — quote not on page`)
    }
  }
}
await browser.close()

console.log(`\nquotes checked ${claims.length} · pass ${pass} · fail ${fails.length} · unreadable ${unreachable.length}`)
fs.writeFileSync(
  `${ROOT}research/quote-check.json`,
  JSON.stringify({ checked_at: new Date().toISOString(), total: claims.length, pass, fails, unreachable }, null, 1),
)
// The site must not call a figure traced until its quote has been read back
// from the live page in CI. This file is that gate.
const status = {}
for (const p of corpus.programs ?? corpus) {
  status[p.name] = {}
  for (const path of Object.keys(p.claim_sources ?? {})) {
    status[p.name][path] = false
  }
}
for (const c of claims) {
  const bad = fails.some(f => f.name === c.name && f.path === c.path)
  const unknown = unreachable.some(u => u.name === c.name && u.path === c.path)
  status[c.name][c.path] = !bad && !unknown
}
fs.writeFileSync(`${ROOT}src/data/quoteStatus.json`, JSON.stringify(status, null, 1) + '\n', )

if (fails.length && !process.argv.includes('--fix-miss')) process.exit(1)
