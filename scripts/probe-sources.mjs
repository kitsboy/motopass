#!/usr/bin/env node
/**
 * MotoPass official-source watchdog — "the rules changed?" detector, v2.
 *
 * Watches every country's official government source (consulate-general,
 * immigration portal, e-visa, CBI unit). Every 24h it re-probes each URL and
 * compares it against a stored baseline. Two signals, deliberately separated:
 *
 *   - rule change   (actionable): a scope that carries RULE text moved
 *                   (fees, thresholds, timelines, requirements, eligibility)
 *   - layout change (informational): the whole page moved but no rule scope did
 *                   (redesign, nav, footer, a new date) — NOT woken for this
 *
 * Detection strategy (robust):
 *   - HTTP first (fast). If the host blocks plain HTTP or serves JS-only
 *     content, escalate to a real browser (headless Chromium via Playwright) —
 *     which recovers most of the "unreachable" government portals that were
 *     never actually down, just bot-gated.
 *   - Hashes are computed over NORMALISED text (whitespace-collapsed), so
 *     formatting/encoding drift does not false-fire.
 *   - Scopes per URL: `whole` (full page), `rule` (sentences carrying fee /
 *     threshold / requirement / eligibility terms), `main` (dominant content
 *     container, when browser-rendered). Any scope changing = a detected
 *     change; `rule`/`main` changing is a RULE change, `whole` alone is layout.
 *   - A URL's probe mode (http vs browser) is pinned on its first baseline so a
 *     mode flip can never look like a content change.
 *
 * Detection facts only. This script NEVER rewrites a rule: it writes an audit
 * entry and a change manifest. A human/agent (Rosa's lane) reviews and updates
 * the corpus. Nothing is auto-published to the live rules.
 *
 * Outputs:
 *   - updates research/countries.json (watch.* + audit_trail on rule change)
 *   - writes public/data/source-monitor.json (the presentation layer reads this)
 *
 * Usage: node scripts/probe-sources.mjs [--dry-run]
 * Env:   PLAYWRIGHT_EXECUTABLE  chromium path (auto-detect if unset)
 *        PLAYWRIGHT_MODULE_DIR   dir to resolve playwright from (default /root/hq)
 *        PROBE_CONCURRENCY       http concurrency (default 6)
 *        PROBE_BROWSER_CONCURRENCY  browser concurrency (default 3)
 *        PROBE_TIMEOUT_MS        per-request timeout (default 12000)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const intelDir = resolve(root, 'public/data')
const manifestPath = resolve(intelDir, 'source-monitor.json')
const eventsPath = resolve(intelDir, 'source-events.json')
const snapsPath = resolve(intelDir, 'source-snapshots.json')
const EVENTS_CAP = 200
const DRY_RUN = process.argv.includes('--dry-run')

function loadJson(path, def) {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return def }
}
function shortDiff(before, after, n = 200) {
  // Best-effort line diff for the change feed. Returns trimmed before/after.
  return { before: (before || '').slice(0, n), after: (after || '').slice(0, n) }
}

const PROBE_TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS ?? 12_000)
const CONCURRENCY = Number(process.env.PROBE_CONCURRENCY ?? 6)
const BROWSER_CONCURRENCY = Number(process.env.PROBE_BROWSER_CONCURRENCY ?? 3)
const UA = 'motopass-intel-probe/2.0 (+https://motopass.giveabit.io)'

// Rule-bearing keyword set — any paragraph/sentence carrying one of these is
// treated as "rule text" and hashed separately. Language-agnostic enough to work
// across every country's portal without hand-crafting 50 selector lists.
const RULE_TERM_RE =
  /\b(\$|€|£|₿|sats?|USD|EUR|GBP|CAD|AUD|CHF|million|minimum|max(?:imum)?|threshold|invest(?:ment)?|require(?:d|ment)?|fee|citizen|citizenship|residen(?:cy|ce|t)?|permit|visa|amount|deposit|qualify|eligible|application|donation|economic|years?|duration)\b/i

// ---------------------------------------------------------------------------
// Hashing (normalised text → stable digest)
// ---------------------------------------------------------------------------
function normalizeText(s) {
  return String(s ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, ' ')
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
function hashText(text) {
  return createHash('sha256').update(normalizeText(text)).digest('hex')
}
function hashBytes(buf) {
  return createHash('sha256').update(buf).digest('hex')
}
// Lines that are volatile and NOT rule text — live tickers, "last updated"
// stamps, copyright, datelines. Dropped from the rule-scope hash so a currency
// ticker or an "updated 2 min ago" line never fires a rule-change alert.
const VOLATILE_RE =
  /(last (updated|modified|reviewed|checked)|updated (just|a moment|now|moments|less than)|©|copyright|\b(as of|live|refresh(?:ed|ing)?|loading|demo|beta)\b|min(?:utes)? ago|second(s)? ago|hour(s)? ago|day(s)? ago|block ?#?\d|\d{4}$)/i
const PURE_NUMERIC_RE = /^[\d$€£.,%+\-≈~\s]+$/

function ruleSentences(text) {
  const clean = normalizeText(text)
  const parts = clean.split(/(?<=[.!?])\s+/)
  return parts
    .filter(p => RULE_TERM_RE.test(p) && p.length > 12)
    .filter(p => !VOLATILE_RE.test(p) && !PURE_NUMERIC_RE.test(p))
    .join(' ')
}

// ---------------------------------------------------------------------------
// HTTP probe
// ---------------------------------------------------------------------------
const CF_MARKERS = /just a moment|attention required|cloudflare|cf-challenge|checking your browser|enable javascript and cookies|ddos protection/i
async function httpProbe(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET', signal: controller.signal, redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
    })
    const ctype = res.headers.get('content-type') || ''
    const buf = Buffer.from(await res.arrayBuffer())
    if (!res.ok) {
      // Cloudflare / bot wall — distinguishable from a real outage, and not
      // something a browser from a datacenter IP will pass either. Skip the
      // browser escalation for these.
      if (res.status === 403 && CF_MARKERS.test(buf.toString('utf8').slice(0, 4000))) {
        return { ok: false, cloudflare: true, error: `HTTP ${res.status} — Cloudflare bot wall` }
      }
      return { ok: false, error: `HTTP ${res.status}` }
    }
    if (/pdf/i.test(ctype) || (buf[0] === 0x25 && buf[1] === 0x50)) {
      return { ok: true, mode: 'http', bytes: buf.length, pdf: true,
               whole: hashBytes(buf), rule: null, main: null }
    }
    const text = buf.toString('utf8')
    // A real page must yield actual rule text. If the http response is a JS
    // shell, a cookie-banner-only page, or yields no rule-bearing sentences,
    // we cannot trust it as a baseline — escalate to the browser so we hash
    // real rendered text. (A cookie banner next to real content is fine and
    // stays on http — its volatile noise is already filtered downstream.)
    const rule = ruleSentences(text)
    const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (stripped.length < 60 || rule.length < 8) {
      return { ok: true, mode: 'http', bytes: buf.length, needsBrowser: true,
               whole: hashText(text), rule: null, main: null, ruleText: null }
    }
    return { ok: true, mode: 'http', bytes: buf.length, pdf: false,
             whole: hashText(text), rule: hashText(rule), main: null,
             ruleText: rule.slice(0, 800) }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'fetch failed' }
  } finally {
    clearTimeout(timer)
  }
}

// One retry for transient network errors (never for an HTTP-403 wall).
async function httpProbeWithRetry(url) {
  const r1 = await httpProbe(url)
  if (!r1.ok && !r1.cloudflare && !/HTTP \d/.test(r1.error)) {
    const r2 = await httpProbe(url)
    return r2.ok ? r2 : r1
  }
  return r1
}

// ---------------------------------------------------------------------------
// Browser probe (Playwright chromium) — recovers bot-gated / JS gov portals
// ---------------------------------------------------------------------------
const requirePw = createRequire(process.env.PLAYWRIGHT_MODULE_DIR || '/root/hq/')
async function launchBrowser() {
  const pw = requirePw('playwright')
  const executable = process.env.PLAYWRIGHT_EXECUTABLE || pw.chromium.executablePath()
  const browser = await pw.chromium.launch({
    executablePath: executable,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
  })
  return { browser, context: await browser.newContext({ userAgent: UA }) }
}

async function browserProbe(url) {
  const { browser, context } = await launchBrowser()
  try {
    const page = await context.newPage()
    await page.setDefaultTimeout(PROBE_TIMEOUT_MS)
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PROBE_TIMEOUT_MS })
    } catch (e) {
      // page may have partially loaded; still try to read content
    }
    await page.waitForTimeout(2500) // let JS settle
    const whole = await page.evaluate(() => document.body ? document.body.innerText : '')
    const main = await page.evaluate(() => {
      const sels = ['main', 'article', '[role="main"]', '#content', '.content', '.main-content', '#main-content']
      let best = null, bestLen = 0
      for (const s of sels) {
        const el = document.querySelector(s)
        if (el) { const t = (el.innerText || '').length; if (t > bestLen) { best = el; bestLen = t } }
      }
      return best ? best.innerText : ''
    })
    // Detect a Cloudflare / bot wall
    const bodyText = whole.toLowerCase()
    const botWalled = /just a moment|attention required|enable javascript and cookies|cf-challenge|access denied/i.test(bodyText)
    return {
      ok: true, mode: 'browser', bytes: Buffer.byteLength(whole),
      pdf: false, botWalled,
      whole: hashText(whole), rule: hashText(ruleSentences(whole)), main: main ? hashText(main) : null,
      ruleText: ruleSentences(whole).slice(0, 800),
    }
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Concurrency helpers
// ---------------------------------------------------------------------------
async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length); let next = 0
  async function worker() { while (next < items.length) { const i = next++; out[i] = await fn(items[i], i) } }
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () => worker())
  await Promise.all(workers); return out
}

// ---------------------------------------------------------------------------
// Probe orchestration per URL
// ---------------------------------------------------------------------------
async function probeTarget(entry) {
  // Pin the mode on first baseline to prevent a http↔browser flip from reading
  // as a content change. Browser is the default for anything that ever needed it.
  const wantBrowser = entry.mode === 'browser'

  let result
  if (wantBrowser) {
    // The mode is pinned to browser because this URL was baselined from a
    // RENDERED page. It must still be probed — a pinned entry that skips the
    // browser produces `result === null` and can only ever report
    // `probe failed`, permanently, no matter how healthy the source is.
    try { result = await browserProbe(entry.url) } catch (e) { result = { ok: false, error: 'browser: ' + (e?.message || e) } }
  } else {
    result = await httpProbeWithRetry(entry.url)
    if (result.cloudflare) {
      // Active bot wall — not passable from a datacenter IP; skip the browser.
      return { ok: false, error: result.error, cloudflare: true }
    }
    if (!result.ok || result.needsBrowser) {
      // escalate: try the browser (covers bot-gated / JS-only hosts)
      try { result = await browserProbe(entry.url) } catch (e) { result = { ok: false, error: 'browser: ' + (e?.message || e) } }
    }
  }
  if (!result || !result.ok) return { ok: false, error: result?.error || 'probe failed', cloudflare: result?.cloudflare }
  if (result.botWalled) {
    // Browser hit a wall — treat as probe-failure (unreachable-ish), not content.
    return { ok: false, error: 'bot-walled (Cloudflare/access challenge)', cloudflare: true }
  }
  return result
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const nowIso = new Date().toISOString()
  const today = nowIso.slice(0, 10)
  const SNAP = loadJson(snapsPath, {})
  const EVENTS = loadJson(eventsPath, [])
  const newEvents = []

  const targets = []
  for (const p of data.programs) {
    const watch = p.watch
    if (!watch?.urls?.length) continue
    for (const entry of watch.urls) targets.push({ p, watch, entry })
  }

  // Browser sessions are expensive → do the whole batch with bounded concurrency.
  const results = await mapWithConcurrency(targets, CONCURRENCY, ({ entry }) => probeTarget(entry))

  const report = {
    schema: 'gab.motopass.source-monitor.v1',
    generated_at: nowIso,
    interval_hours: 24,
    total_urls: targets.length,
    ok: 0, changed: 0, layout_changed: 0, unreachable: 0, cloudflare_blocked: 0,
    changed_countries: [],
    blocked_urls: [],
    unreachable_urls: [],
    by_country: [],
  }

  for (let i = 0; i < targets.length; i++) {
    const { p, watch, entry } = targets[i]
    const result = results[i]

    if (!result.ok) {
      const isBlocked = result.cloudflare === true
      const status = isBlocked ? 'blocked' : 'unreachable'
      report[isBlocked ? 'cloudflare_blocked' : 'unreachable']++
      // start / keep the coverage clock whenever the URL is failing
      entry.status_since = entry.status_since || nowIso
      if (entry.status !== status) {
        entry.status = status
        entry.last_probed = nowIso
        entry.last_error = result.error
        if (entry.scopes && entry.scopes.whole?.last_hash) {
          newEvents.push({ id: `${nowIso}-${entry.url.slice(-8)}-${status}`, ts: nowIso, date: today,
                           country: p.name, program_id: p.id, url: entry.url, kind: 'coverage',
                           status, before: null, after: null })
        }
      }
      const row = { program_id: p.id, name: p.name, url: entry.url, error: result.error }
      ;(isBlocked ? report.blocked_urls : report.unreachable_urls).push(row)
      continue
    }

    delete entry.status_since // recovered / probing fine

    report.ok++
    entry.last_probed = nowIso
    entry.mode = entry.mode || result.mode
    delete entry.last_error

    // ---- normalise scopes on the entry (whole / rule / main) ----
    entry.scopes = entry.scopes || {}
    entry.scopes.whole = entry.scopes.whole || {}
    entry.scopes.rule = entry.scopes.rule || {}
    if (result.main != null) entry.scopes.main = entry.scopes.main || {}

    const scopes = []
    scopes.push({ key: 'whole', label: 'Full page', newHash: result.whole })
    if (result.rule != null) scopes.push({ key: 'rule', label: 'Rule terms (fees · thresholds · requirements)', newHash: result.rule })
    if (result.main != null) scopes.push({ key: 'main', label: 'Main content', newHash: result.main })

    // ---- baseline vs change (with volatility suppression) ----
    // A rule scope only ALERTS once the same new value is seen on two
    // consecutive probes (pending → confirmed). Live tickers, "last updated"
    // stamps and rotating banners settle out instead of firing every run.
    const isBaseline = !entry.scopes.whole?.last_hash && !entry.last_hash
    let ruleChanged = false
    let layoutChanged = false
    const changedScopes = []
    const oldRuleHash = entry.scopes.rule?.last_hash
    for (const s of scopes) {
      const st = entry.scopes[s.key]
      const prev = st?.last_hash
      const pend = st?.pending_hash
      if (prev == null) { st.last_hash = s.newHash; delete st.pending_hash; continue }
      if (s.newHash === prev) { delete st.pending_hash; continue }
      if (s.key === 'whole') { layoutChanged = true; st.last_hash = s.newHash; changedScopes.push(s.label); continue }
      // rule / main scope moved — confirm before alerting
      if (pend === s.newHash) { ruleChanged = true; st.last_hash = s.newHash; delete st.pending_hash; changedScopes.push(s.label) }
      else { st.pending_hash = s.newHash }
    }

    // ---- rule-text snapshot + change event (the diff the feed shows) ----
    if (result.ruleText != null) {
      const snap = (SNAP[entry.url] = SNAP[entry.url] || {})
      const before = (ruleChanged && snap.rule && snap.rule.hash === oldRuleHash) ? snap.rule.text : null
      if (ruleChanged) {
        newEvents.push({
          id: `${nowIso}-${entry.url.slice(-8)}-rule`, ts: nowIso, date: today,
          country: p.name, program_id: p.id, url: entry.url, kind: 'rule',
          scopes: changedScopes, before, after: result.ruleText.slice(0, 220),
        })
      }
      if (!(snap.rule && snap.rule.hash === oldRuleHash && !ruleChanged)) {
        snap.rule = { hash: entry.scopes.rule.last_hash, text: result.ruleText }
      }
    }

    if (isBaseline) {
      entry.status = 'ok'
      entry.baselined_at = nowIso
    } else if (ruleChanged) {
      entry.status = 'changed'
      watch.changed = true
      report.changed++
      report.changed_countries.push({ program_id: p.id, name: p.name, url: entry.url, scopes: changedScopes })
      if (!Array.isArray(p.audit_trail)) p.audit_trail = []
      p.audit_trail.push({
        date: today,
        field: `watch.${entry.url}`,
        to: `Rule-bearing content confirmed changed on official source: ${changedScopes.join(' · ')} — review required`,
        source: 'source-probe-v2',
        hash: entry.scopes.whole?.last_hash?.slice(0, 16),
      })
    } else if (layoutChanged) {
      entry.status = 'ok'
      report.layout_changed++
      entry.last_layout_change = nowIso
    } else {
      entry.status = 'ok'
    }

    // keep the whole-page hash in sync (used by older consumers / fallback)
    entry.last_hash = entry.scopes.whole?.last_hash
  }

  for (const p of data.programs) {
    if (p.watch) p.watch.last_probe_at = nowIso
  }

  // ---- manifest for the presentation layer ----
  const byCountry = []
  let coverageGapCountries = 0
  function gapDays(since) {
    if (!since) return 0
    try { return Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 86400000)) } catch { return 0 }
  }
  for (const p of data.programs) {
    const urls = (p.watch?.urls || []).map(u => ({
      url: u.url, status: u.status, mode: u.mode || null,
      last_probed: u.last_probed || null,
      baselined_at: u.baselined_at || null,
      status_since: u.status_since || null,
      coverage_gap_days: gapDays(u.status_since),
      scopes: Object.fromEntries(Object.entries(u.scopes || {}).map(([k, v]) => [k, { label: v.label || k, last_hash: v.last_hash?.slice(0, 12), changed: v.changed || false }])),
      last_error: u.last_error || null,
    }))
    const gap = Math.max(0, ...urls.map(u => u.coverage_gap_days || 0))
    if (gap > 0) coverageGapCountries++
    byCountry.push({ program_id: p.id, name: p.name, changed: p.watch?.changed === true,
                     coverage_gap_days: gap, urls })
  }
  report.by_country = byCountry
  report.coverage_gap_count = coverageGapCountries
  report.ok_count = report.ok; report.changed_count = report.changed
  report.layout_changed_count = report.layout_changed

  // ---- persist events + snapshots (rolling) ----
  const allEvents = [...newEvents, ...EVENTS].slice(0, EVENTS_CAP)
  report.last_events = allEvents.slice(0, 8)

  if (!DRY_RUN) {
    writeFileSync(countriesPath, JSON.stringify(data, null, 2) + '\n')
    mkdirSync(intelDir, { recursive: true })
    writeFileSync(manifestPath, JSON.stringify(report, null, 2) + '\n')
    writeFileSync(eventsPath, JSON.stringify(allEvents, null, 2) + '\n')
    writeFileSync(snapsPath, JSON.stringify(SNAP, null, 2) + '\n')
  }

  console.log(`✓ Source probe v2 — ${targets.length} URLs · ok ${report.ok} · rule-changed ${report.changed} · ` +
    `layout-changed ${report.layout_changed} · cloudflare-blocked ${report.cloudflare_blocked} · unreachable ${report.unreachable}${DRY_RUN ? ' (dry-run)' : ''}`)
  if (report.changed_countries.length) {
    console.log('  RULE CHANGED:', report.changed_countries.map(c => `${c.name} [${c.scopes.join('|')}]`).join(', '))
  }
  if (report.blocked_urls.length) {
    console.log('  CLOUDFLARE-BLOCKED (need alternate official source):', report.blocked_urls.map(u => u.name).join(', '))
  }
  if (report.unreachable_urls.length) {
    console.log('  UNREACHABLE:', report.unreachable_urls.map(u => u.name).join(', '))
  }
}

main().catch(err => { console.error(err); process.exit(1) })
