#!/usr/bin/env node
/**
 * Link check for every watched source URL.
 *
 * A source page that returns 200 can still be a lie: a parked domain, a WAF
 * challenge, or a redirect to a marketing site. This walks the 117 URLs in the
 * corpus, records what actually came back, and classifies them:
 *
 *   ok        200 with content
 *   redirected  3xx to a different host (the citation is out of date)
 *   blocked   401/403/429/503 or a bot challenge
 *   dead      NXDOMAIN — the domain is gone
 *   unreachable  name resolves but the fetch fails from here (TLS, timeout, geo)
 *   error      anything else
 *
 * Writes research/link-check.json and prints counts by class.
 */
import fs from 'node:fs'
import dns from 'node:dns/promises'

const ROOT = new URL('..', import.meta.url).pathname
const corpus = JSON.parse(fs.readFileSync(`${ROOT}research/countries.json`, 'utf8'))

// The corpus citations (117) and the watchdog's own snapshot set (122) are two
// different lists. Check both: a dead page can be in either.
const urls = new Map()
try {
  const snap = JSON.parse(fs.readFileSync(`${ROOT}public/data/source-snapshots.json`, 'utf8'))
  for (const u of Object.keys(snap)) {
    // The snapshot file also carries synthetic keys (industry_imidaily_…) for
    // pages that were read but are not addresses. Only check real URLs.
    if (!/^https?:\/\//.test(u)) continue
    urls.set(u, ['watchdog'])
  }
} catch {
  /* snapshot file is generated; absence is not an error here */
}
for (const p of corpus.programs ?? corpus) {
  for (const s of p.sources ?? []) {
    const m = String(s).match(/https?:\/\/[^\s,;)]+/)
    if (!m) continue
    const url = m[0].replace(/[.,;]$/, '')
    if (!urls.has(url)) urls.set(url, [])
    urls.get(url).push(p.name)
  }
}

async function classify(url) {
  const host = new URL(url).hostname
  try {
    await dns.lookup(host)
  } catch {
    return { state: 'dead', reason: 'DNS does not resolve (NXDOMAIN)', status: null, finalUrl: null }
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 20000)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (MotoPass link check)' },
    })
    clearTimeout(timer)
    const body = await res.text().catch(() => '')
    const finalHost = new URL(res.url).hostname
    const offsite = finalHost !== host.replace(/^www\./, '') && finalHost !== host
    if (res.status === 401 || res.status === 403 || res.status === 429 || res.status === 503) {
      return { state: 'blocked', reason: `HTTP ${res.status}`, status: res.status, finalUrl: res.url }
    }
    if (offsite) {
      return { state: 'redirected', reason: `to ${finalHost}`, status: res.status, finalUrl: res.url }
    }
    if (!res.ok) return { state: 'error', reason: `HTTP ${res.status}`, status: res.status, finalUrl: res.url }
    if (body.trim().length < 400) {
      return { state: 'error', reason: '200 but almost no content (JS shell or parked)', status: res.status, finalUrl: res.url }
    }
    return { state: 'ok', reason: '', status: res.status, finalUrl: res.url }
  } catch (err) {
    clearTimeout(timer)
    // The name resolved, so the domain is alive: this machine or the site's
    // edge refused us. That is not the same finding as a dead domain.
    return {
      state: 'unreachable',
      reason: String(err.message || err).slice(0, 80),
      status: null,
      finalUrl: null,
    }
  }
}

const results = []
for (const [url, countries] of urls) {
  const r = await classify(url)
  results.push({ url, countries, ...r })
  console.log(`${r.state.padEnd(10)} ${url} ${r.reason}`)
}

const counts = results.reduce((acc, r) => ({ ...acc, [r.state]: (acc[r.state] ?? 0) + 1 }), {})
fs.writeFileSync(
  `${ROOT}research/link-check.json`,
  JSON.stringify({ checked_at: new Date().toISOString(), total: results.length, counts, results }, null, 1),
)
console.log('\n' + JSON.stringify(counts))
console.log('dead:', results.filter(r => r.state === 'dead').map(r => r.url).join('\n     '))
