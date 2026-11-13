#!/usr/bin/env node
/**
 * Claim-quote evidence: fetch every claim's URL and say whether the quoted words
 * are actually on the page right now.
 *
 * This is what "fetched <date>" must mean. A date is only honest if a fetch
 * happened and the words were found; a paraphrase is reported as MISSING, not
 * rounded up to "found".
 *
 * Usage: node scripts/check-claim-quotes.mjs [--record]
 *   --record  write today's date into `verified_at` for claims whose quote matched
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const CORPUS = new URL('../research/countries.json', import.meta.url)
const RECORD = process.argv.includes('--record')
const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))

const text = (url) => {
  const html = execFileSync('curl', ['-sL', '--max-time', '25', '-A', 'Mozilla/5.0', url], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;|&ndash;/g, '\u2013')
    .replace(/&#8217;|&rsquo;/g, '\u2019')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
}

const norm = (s) => s.replace(/[\s\u00a0]+/g, ' ').replace(/[\u2013\u2014]/g, '-').trim().toLowerCase()

let checked = 0
let found = 0
const missing = []
const today = new Date().toISOString().slice(0, 10)

for (const program of corpus.programs) {
  for (const [path, claim] of Object.entries(program.claim_sources ?? {})) {
    if (!claim?.url || !claim?.quote) continue
    checked += 1
    let page = ''
    try {
      page = text(claim.url)
    } catch {
      missing.push(`${program.name} · ${path} — page unreachable`)
      continue
    }
    if (norm(page).includes(norm(claim.quote))) {
      found += 1
      if (RECORD) claim.verified_at = today
    } else {
      missing.push(`${program.name} · ${path} — quote not on page: "${claim.quote.slice(0, 70)}"`)
    }
  }
}

if (RECORD) writeFileSync(CORPUS, JSON.stringify(corpus, null, 2) + '\n')

for (const line of missing) console.error('✗ ' + line)
console.log(`${found} of ${checked} claim quotes found on their page today`)
process.exit(missing.length ? 1 : 0)
