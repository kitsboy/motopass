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
 *   - v3 (2026-09-15): every scope is built from CONTENT BLOCKS. <script>,
 *     <style>, <head> and JSON-LD are stripped before extraction, and nav menus,
 *     press/news rails, cookie modals, rates tickers and inline CSS are dropped
 *     as chrome. sha256('') is NOT a baseline: a URL with no rule text is
 *     recorded as "no rule scope" and never alerted on, and a page that renders
 *     to no text is reported `unreachable` instead of `ok`. Changing the
 *     extraction pipeline (EXTRACT_V) re-baselines silently once, so a pipeline
 *     upgrade can never fire a corpus-wide rule alarm.
 *   - v6 (2026-09-15): five fixes, all measured against the live corpus:
 *     · `whole` is a SET of content blocks, not a sequence — a marquee/rotating
 *       rail that re-serves the same blocks in another order is not a page change
 *       (edbmauritius.org's sector ticker: identical block set, new hash per load);
 *     · machine stamps are churn — request/incident/correlation tokens, WAF and
 *       CDN cache-busters, compact ISO request stamps, load countdowns;
 *     · a page's own DATELINE (live clock, in any of the watched languages) is not
 *       content, while a rule sentence that carries a deadline time is;
 *     · WAF / bot-challenge pages are named as walls (`blocked`) instead of being
 *       baselined as `ok` content with a per-request token in the hash;
 *     · money figures reach the RULE scope, so a fee-table edit is visible there
 *       instead of being dropped as "a bare number";
 *     · every whole-scope move is attributed per-URL in the report
 *       (`layout_changed_urls` + a consecutive-run streak), so the next observer
 *       can see WHICH page drifted without re-probing the corpus.
 *   - v7 (2026-09-15): two defects, both measured (card t_8b9ff3c4):
 *     · a WAF JS challenge is a STATE, not a verdict. The browser path read the
 *       interstitial once at `settleMs` and classified the wall as the page, so
 *       Cyprus's authoritative Regulation 6(2) page — readable from THOR after
 *       ~8 s — could never be seen. The browser path now waits the challenge out
 *       (poll + confirm-read, capped by CHALLENGE_WAIT_MS) before classifying;
 *       a wall that never clears still reports `blocked`;
 *     · the `rule` scope is a sorted SET of sentences, like `whole`, so an
 *       order-only re-order of rule sentences is no longer a rule change
 *       (measured on invest.gov.tr: two rule sentences swapped, false flags);
 *     · the browser fan-out honours BROWSER_CONCURRENCY — it was declared and
 *       never enforced, so six Chromium instances ran at once and the load itself
 *       made solvable WAF challenges time out. A bot wall is now also retried
 *       once on a fresh session before it counts as final.
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
 * Usage: node scripts/probe-sources.mjs [--dry-run] [--self-test]
 * Env:   PLAYWRIGHT_EXECUTABLE  chromium path (auto-detect if unset)
 *        PLAYWRIGHT_MODULE_DIR   dir to resolve playwright from (default /root/hq)
 *        PROBE_CONCURRENCY       http concurrency (default 6)
 *        PROBE_BROWSER_CONCURRENCY  browser concurrency (default 3)
 *        PROBE_TIMEOUT_MS        per-request timeout (default 12000)
 *        CHALLENGE_WAIT_MS       how long to wait out a WAF JS challenge (default 30000)
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
// Extraction-pipeline version. Bump it whenever the text pipeline below changes
// meaning (new stripping, new filters): stored baselines are then re-written
// silently once instead of being read as content changes.
const EXTRACT_V = 7
// A page whose extracted text is shorter than this carries no usable content —
// it is not a baseline. Matches the "real page" threshold httpProbe already used.
const MIN_TEXT_LEN = 60

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

// Rule-bearing keyword set — any sentence carrying one of these is treated as
// "rule text" and hashed separately. Language-agnostic on purpose: these portals
// publish in EN/ES/IT/PT/FR/DE/JP, and an English-only term set made every
// non-English page yield ZERO rule sentences (2026-09-15 rule-event verification).
// Three regexes because \b is ASCII-based and never matches inside a CJK run, and
// a bare currency symbol next to a figure is a rule signal on its own.
const RULE_TERM_RE =
  /\b(sats?|usd|eur|gbp|cad|aud|chf|jpy|aed|million|billion|minimum|max(?:imum)?|threshold|invest(?:ment|ments|or|ors)?|require(?:d|ment|ments|s)?|fees?|citizen(?:ship)?|residen(?:cy|ce|t|ts)?|permit|visa|amount|deposit|qualify|eligible|application|donations?|economic|years?|duration|tarifas?|requisitos?|residencia|inversi[oó]n|inversionistas?|inversor(?:es)?|monto|dep[oó]sitos?|solicitud(?:es)?|ciudadan[ií]a|nacionalidad(?:es)?|elegibles?|a[nñ]os|m[ií]nimos?|m[áa]ximos?|d[oó]lares|plazos?|impuestos?|arraigo|vistos?|investimento|importi?|domandas?|cittadinanza|idone[oi]|anni|minim[oi]|massim[oi]|frais|exigences?|r[eé]sidence|investissement|montants?|d[eé]p[oô]ts?|demandes?|citoyennet[eé]|ann[eé]es|taxas?|resid[eê]ncia|valores?|pedidos?|cidadania|eleg[ií]vel|geb[uü]hr(?:en)?|anforderungen?|aufenthalt(?:stitel|s)?|visum|investition(?:en)?|betrag|antrag|staatsangeh[oö]rigkeit|jahre|permanent|naturaliz)\b/i
// CJK rule terms actually in use by the watched Japanese program (ISA).
const RULE_TERM_CJK_RE =
  /(手数料|在留|査証|ビザ|申請|要件|必要|収入|資産|期間|永住|帰化|投資|移民|料金|許可|延長|納付|更新|万円|円)/
const CURRENCY_SYM_RE = /[$€£₿¥]/
const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/

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
// stamps, copyright, datelines. Dropped from BOTH scopes so a currency ticker or
// an "updated 2 min ago" line never fires a change alert.
const VOLATILE_RE =
  /(last (updated|modified|reviewed|checked)|updated (just|a moment|now|moments|less than)|©|copyright|\b(as of|live|refresh(?:ed|ing)?|loading|demo|beta)\b|min(?:utes)? ago|second(s)? ago|hour(s)? ago|day(s)? ago|block ?#?\d|\d{4}$)/i
const PURE_NUMERIC_RE = /^[\d$€£.,%+\-≈~\s]+$/
// Money and money-shaped figures are rule content, not ticker noise: a fee table
// publishes the amount as its own block ("$ 1,300" / "1,300"), and dropping it
// made a fee change invisible to the RULE scope — mutation-tested on the Hong Kong
// ImmD fee pages 2026-09-15. It stays churn for the whole-page scope: a bare
// thousands-separated figure there is usually a counter (cancilleria.gob.bo's
// "3,463,022" ticker), which drifts on every run.
const AMOUNT_RE = /[$€£₿¥]|\d{1,3}(?:,\d{3})+(?:\.\d+)?/
// Machine-generated stamps that carry no rule text and change on EVERY request:
// request / incident / correlation ids, WAF + CDN cache-busters, compact ISO
// request stamps and live clocks. Measured on 6 URLs in the 2026-09-15 daily run
// (Cyprus moi/mof, Philippines boi, Spain inclusion, Bulgaria bnb/mfa).
const STAMP_HEX_RE = /^[0-9a-f]{16,}$/i
const STAMP_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STAMP_ISO_RE = /^\d{8}T\d{6}(?:\.\d+)?Z?(?:$|[\s-])/
const STAMP_CDN_RE = /^\d+\.[0-9a-f]{4,}\.\d{6,}(?:\.[0-9a-z]+)?$/i
// An id sentence only counts when it actually CARRIES the token — a rule
// sentence that merely says "a reference number issued by the office" is rule
// text, so the token must contain a digit.
const STAMP_ID_RE = /\b(?:incident|request|session|trace|correlation|reference|event|transaction|support)\s+(?:id|no|number|ref)\b[^0-9]{0,12}[A-Za-z0-9-]*\d[A-Za-z0-9-]{6,}/i
// A countdown the page renders while it loads ("Acknowledge (9s)",
// thaievisa.go.th) is a load artefact, not content.
const STAMP_COUNTDOWN_RE = /\(\s*\d+\s*s(?:ec(?:onds?)?)?\s*\)/i
// A clock must DOMINATE its block (≤40 chars) — a real rule sentence that
// happens to carry a deadline time is rule content, not a live clock.
const STAMP_CLOCK_RE = /\b\d{1,2}:\d{2}:\d{2}\b|\b\d{1,2}:\d{2}\s?(?:UTC|GMT|CET|CEST|BST|am|pm)\b/i
function isVolatileStamp(line) {
  const s = String(line ?? '').trim()
  if (!s) return false
  if (STAMP_HEX_RE.test(s) || STAMP_UUID_RE.test(s) || STAMP_CDN_RE.test(s)) return true
  if (STAMP_ISO_RE.test(s) || STAMP_COUNTDOWN_RE.test(s)) return true
  if (s.length <= 120 && STAMP_ID_RE.test(s)) return true
  if (s.length <= 40 && STAMP_CLOCK_RE.test(s)) return true
  return false
}

// A page's own clock / dateline is not content either, and the LIVE clock cases
// are longer than the narrow stamp rule above: "Costa Rica, Martes 15 de Setiembre
// de 2026 6:19:41 p.m." / "Dimarts, 15 de setembre del 2026 | 18:19:45". They
// carry no rule terms, but they moved the whole-page hash every run. Recognised by
// STRIPPING the date/time vocabulary (months, weekdays, glue words, digits,
// punctuation) across the languages we watch: what is left of a dateline is little
// more than a place name. Only the whole-page scope uses this — a rule sentence
// that carries a deadline time is rule text and still counts.
const DATE_TOKEN_RE = new RegExp(`\\b(?:${
  [
    // months
    'january|february|march|april|may|june|july|august|september|october|november|december',
    'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre',
    'gener|febrer|març|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre',
    'janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre',
    'januar|februar|märz|maerz|juni|juli|oktober|dezember',
    'gennaio|febbraio|aprile|maggio|giugno|luglio|settembre|ottobre|dicembre',
    'janeiro|fevereiro|março|marco|maio|junho|julho|setembro|outubro|novembro|dezembro',
    // weekdays
    'monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun',
    'lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo',
    'dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge',
    'lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche',
    'montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag',
    'lunedì|lunedi|martedì|martedi|mercoledì|mercoledi|giovedì|giovedi|venerdì|venerdi|sabato|domenica',
    'segunda|terça|terca|quarta|quinta|sexta',
    // glue, zones, units
    'de|del|of|the|at|on|in|am|pm|utc|gmt|cet|cest|bst|est|edt|pst|h|hrs|hr|seg|min',
  ].join('|')
})\\b\\.?`, 'giu')
function isClockStamp(line) {
  const s = String(line ?? '').trim()
  if (s.length > 90) return false
  if (!/\d{1,2}:\d{2}/.test(s)) return false // must carry an actual clock
  const rest = s
    .replace(/[0-9]+/g, ' ')
    .replace(DATE_TOKEN_RE, ' ')
    .replace(/[^\p{L}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return rest.length <= 16
}

// A bot / WAF challenge page is NOT content and NOT a page change: the challenge
// text is fixed and the token next to it is per-request, so a page that silently
// becomes `ok` on a challenge moves its hash on every run. Observed live
// 2026-09-15, all baselined as `ok` content by v5:
//   · "One moment, we're checking you're not a bot." + token — Cyprus moi/mof.gov.cy, Philippines boi.gov.ph
//   · "You reached this page when trying to access … from <ip> on <date>" — Bulgaria mfa.bg (Radware)
//   · "Error Error Error This page can't be displayed … The incident ID is: …" — Bulgaria bnb.bg
//   · "Acceso denegado … Dirección IP: …" — Spain inclusion.gob.es
const BOT_WALL_RE = /just a moment|attention required|enable javascript (?:and cookies|to (?:view|continue))|cf-challenge|cf_chl|ddos protection|checking you'?re not a bot|verifying you are human|are you a robot|hcaptcha|recaptcha|radware error page|perfdrive\.com|this page can'?t be displayed|you reached this page when trying to access|request rejected by the security/i
// A block page in another language still names the denial AND the technical
// detail it hands the visitor — that pairing is what makes it a wall page rather
// than prose that happens to mention access being denied.
const WAF_CONTEXT_RE = /(access denied|acceso denegado|zugriff verweigert|acc[eè]s refus[ée]|acesso negado|accesso negato)[\s\S]{0,240}(ip address|direcci[oó]n ip|c[oó]digo de error|error code|incident id|reference id|request id)/i
function isBotWall(text) {
  return BOT_WALL_RE.test(text) || WAF_CONTEXT_RE.test(text)
}

// sha256 of the empty string — what a scope hashes to when nothing was
// extracted. It is the absence of a scope, not a baseline: two empty hashes
// "matching" says nothing, and empty→text reads as a change every time.
const EMPTY_SHA = hashText('')

// Chrome / boilerplate that carries rule-ish words by accident: nav menus,
// press-release rails, cookie modals, ECB-style rates tickers, promo CTAs.
// Observed 2026-09-15 — enterprise.gov.ie (nav), centralbank.ie (nav + a press
// rail dated the same day + a rates ticker), interno.gov.it (cookie modal).
const CHROME_RE =
  /\b(press release|news release|media release|read more|learn more|find out more|latest news|in the news|report finds|findings? (?:of|from) the|announces|announced|appoints|appointment of|appointment to|speech by|statement by|skip to (main )?content|accept (all )?cookies|cookies?|consent|subscribe|newsletter|follow us|share (this|on)|back to top|director of|chief executive|opening hours|our services|sitemap|accessibility|privacy (policy|statement)|terms of use|all rights reserved|log ?in|sign ?in|contact us|about us|careers|deposit facility|main refinancing|lending facility|exchange rates?|interest rates?|reference rate)\b/i
// A line that is nothing but nav labels — "Publications Legislation
// Consultations FAQs" / "Home | Services Downloads Requirements FAQs Contact Us".
const NAV_WORD =
  '(?:home|about(?: us)?|contact(?: us)?|news|events?|publications?|legislation|consultations?|faqs?|search|menu|log ?in|sign ?in|register|careers?|media|services|resources|downloads?|requirements|online services|our offices|language|english|espa[nñ]ol)'
const NAV_RE = new RegExp(`^${NAV_WORD}(?:\\s*[|·>»/–-]?\\s*${NAV_WORD})*[|·>»/–-]?$`, 'i')
// Serialised CSS / JSON-LD / JS that leaked into the text stream (WordPress,
// Elementor, escaped cookie-compliance markup).
const CODE_RE =
  /(\{\s*[-a-z]+\s*:|;\s*[-a-z-]+\s*:|\}\s*[.,;]|::?[-a-z-]+\s*\{|--wp--|\.wp-|elementor-|window\.|document\.|function\s*\(|=>\s*\{|\\u00[0-9a-f]{2}|&lt;|&quot;|&amp;lt;|application\/ld\+json|"@(?:type|context|id)"|var\s+--)/i

// ---------------------------------------------------------------------------
// Text extraction (v3) — script/style/head/JSON-LD stripped, markup reduced to
// content blocks, chrome dropped. Both scopes are built from the same blocks.
// ---------------------------------------------------------------------------
function stripNonContent(html) {
  return String(html ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')   // includes JSON-LD blocks
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
}
const BLOCK_END_RE =
  /<\/(p|div|li|tr|h[1-6]|section|article|header|footer|nav|ul|ol|table|form|button|blockquote|figure|dd|dt|a)>/gi
// Structural site chrome — dropped whole, before any text extraction. Nav bars,
// headers and footers are where "Apply for an employment permit" /
// "Notification Requirement for Payment Service Providers" come from.
function stripStructuralChrome(html) {
  return String(html ?? '')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, ' ')
}
// Block-level text units. Splitting on block ends and on </a> (a link is almost
// always a nav/menu item) — but not on <span>/<td> — keeps a table row as one
// unit instead of shredding rule sentences into fragments.
function contentBlocks(html) {
  return stripStructuralChrome(stripNonContent(html))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(BLOCK_END_RE, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split(/\r?\n/)
    .map(l => normalizeText(l))
    .filter(Boolean)
}
function isChurn(line) {
  if (!line) return true
  return (
    isVolatileStamp(line) ||
    PURE_NUMERIC_RE.test(line) ||
    VOLATILE_RE.test(line) ||
    CHROME_RE.test(line) ||
    NAV_RE.test(line) ||
    CODE_RE.test(line)
  )
}
// `whole` scope — the SET of content blocks a page carries, minus churn and the
// page's own clock. Order-insensitive on purpose: a marquee / rotating rail that
// re-serves the same blocks in a different order (edbmauritius.org's sector
// ticker — measured 2026-09-15: identical block set, different sequence, new hash
// on every load) is not a page change. Adding, removing or editing a block still
// moves the hash.
function wholeText(html) {
  return [...new Set(contentBlocks(html).filter(l => !isChurn(l) && !isClockStamp(l)))].sort().join(' ')
}
// Sentence splitter: `[.!?]` + the CJK terminators (。．！？；) that an
// English-only splitter never saw, so a Japanese render produced one giant
// fragment that then failed the term test.
function splitSentences(line) {
  return line.split(/(?<=[.!?])\s+|(?<=[\u3002\uff0e\uff01\uff1f\uff1b])/)
}
function hasRuleTerm(p) {
  return RULE_TERM_RE.test(p) || RULE_TERM_CJK_RE.test(p) || CURRENCY_SYM_RE.test(p)
}
// A short, figure-free, non-declarative candidate is a nav label or a call to
// action that merely contains a rule word — "Apply for an employment permit",
// "Do you require special assistance?", "Management of Investment Assets".
// Real rule statements either carry a figure (fee, threshold, duration) or read
// as a sentence.
function isNavFragment(p) {
  if (p.length >= 60) return false
  if (/\d/.test(p) || CURRENCY_SYM_RE.test(p)) return false
  return !/[.。]$/.test(p)
}
// `rule` scope — sentences that actually state a fee / threshold / requirement /
// eligibility term, harvested only from non-chrome blocks. Repeated figure-free
// candidates are site chrome (the same menu rendered twice) and are dropped.
//
// Like `whole`, the result is a sorted SET of sentences, never a DOM-ordered
// join: a rail/accordion that re-orders its rule sentences is not a rule change.
// Measured on invest.gov.tr 2026-09-15 (Turkey): two rule sentences swapped by
// the page, the sorted whole scope stayed put, and only the rule scope moved —
// which fired a false rule-change on a page whose rules had not changed.
function ruleSentences(html) {
  const candidates = []
  for (const block of contentBlocks(html)) {
    if (isChurn(block)) continue
    for (const raw of splitSentences(block)) {
      const p = raw.trim()
      if (!p) continue
      // CJK sentences carry more meaning per character than Latin ones.
      // A money figure is rule text however short it is: fee tables publish the
      // amount as its own block ("$ 1,300", "HK$600"), and the length guard
      // otherwise discarded exactly the number a fee change moves.
      if (p.length <= (CJK_RE.test(p) ? 6 : 12) && !AMOUNT_RE.test(p)) continue
      if (!hasRuleTerm(p)) continue
      if (VOLATILE_RE.test(p) || (PURE_NUMERIC_RE.test(p) && !AMOUNT_RE.test(p))) continue
      if (CODE_RE.test(p) || NAV_RE.test(p)) continue
      if (isNavFragment(p)) continue
      candidates.push(p)
    }
  }
  const counts = new Map()
  for (const p of candidates) {
    const key = p.toLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  // Order-insensitive (see the comment above): dedupe, then sort, so a page that
  // merely re-orders the same rule sentences keeps its rule hash.
  return [...new Set(candidates.filter(p => (counts.get(p.toLowerCase()) === 1 || /\d|[$€£₿¥]/.test(p))))].sort().join(' ')
}

// ---------------------------------------------------------------------------
// HTTP probe
// ---------------------------------------------------------------------------
// CF_MARKERS is the 403-response variant: it may also lean on the words
// "cloudflare" / "checking your browser" / a bare "access denied", which are too
// loose to test against a rendered body (a footer can mention Cloudflare, and a
// rule page can say that access is denied).
const CF_MARKERS = new RegExp(`${BOT_WALL_RE.source}|cloudflare|checking your browser|access denied`, 'i')
// A bot challenge is not content. Observed 2026-09-15: three of the 16
// whole-scope drifters were challenge pages ("One moment, we're checking you're
// not a bot." + a per-request token) that had been baselined as `ok` CONTENT —
// Cyprus moi/mof.gov.cy and Philippines boi.gov.ph — so their hash moved on
// every run. Naming the wall is the honest classification: blocked, not ok.
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
    // A real page must yield actual content text. If the http response is a JS
    // shell, a cookie-banner-only page, or yields no rule-bearing sentences,
    // we cannot trust it as a baseline — escalate to the browser so we hash
    // real rendered text. (A cookie banner next to real content is fine and
    // stays on http — its volatile noise is already filtered downstream.)
    const rule = ruleSentences(text)
    const page = wholeText(text)
    // v2.2 guard, kept: rule text that smells like a JS app bundle is not rule
    // text — treat it as no-rule and escalate to the browser. The extraction
    // pipeline already filters code-like candidates, so this is belt-and-braces.
    const smellsLikeCode = /function\s*\(|=>\s*\{|\btypeof\b|\bdocument\.|\bwindow\.|\.getElementById|import\s*\{|console\./m.test(rule)
    if (page.length < MIN_TEXT_LEN || rule.length < 8 || smellsLikeCode) {
      return { ok: true, mode: 'http', bytes: buf.length, needsBrowser: true, textLen: page.length,
               whole: hashText(page), rule: null, main: null, ruleText: null }
    }
    return { ok: true, mode: 'http', bytes: buf.length, pdf: false, textLen: page.length,
             whole: hashText(page), rule: hashText(rule), main: null,
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
// A WAF JS challenge is a STATE, not a verdict. The interstitial is served with
// a 403, its script solves the challenge, and the SAME page is then re-requested
// with an auth token — the origin only answers on that second request. Measured
// from THOR 2026-09-15 with the engine's own Chromium + UA (card t_8b9ff3c4):
//   · gov.cy/mip-md/…/immigration-permits-for-investors/ — at settleMs=2500 the
//     body is "One moment, we're checking you're not a bot." + a per-request
//     stamp (title "Azure WAF"); the token navigation lands at ~5.7 s and the
//     real page (20,278 chars, Regulation 6(2)) is readable at ~8.6 s;
//   · www.moi.gov.cy / www.mof.gov.cy — same challenge, cleared at 7.2–8.8 s in
//     two independent runs.
// Reading once at settleMs therefore records the wall as the page forever.
// Wait it out, then read again; a wall that never clears returns its last render
// and is still classified `blocked`.
//
// How long to wait was MEASURED, not guessed (2026-09-15): the same challenge
// settles in ~8 s with one Chromium, 11-19 s with three at once, and 17-21 s
// with the harness's own fan-out — which was using the HTTP limit (6) instead of
// BROWSER_CONCURRENCY (3), below. A 15 s cap therefore made solvable walls
// flap `ok`/`blocked` between runs (measured across two full corpus runs), so the
// cap is 30 s and the browser fan-out is now actually gated.
const CHALLENGE_WAIT_MS = Number(process.env.CHALLENGE_WAIT_MS ?? 30_000)
// Markers of the interstitial itself. Deliberately NOT added to BOT_WALL_RE:
// CF_MARKERS is derived from it and a 403 that matched there would short-circuit
// httpProbe to `cloudflare` and skip the browser escalation — the one path that
// can actually solve the challenge.
const CHALLENGE_PAGE_RE =
  /azure waf|afd_azwaf|please enable javascript to run this application|an unexpected error occured|checking you'?re not a bot|just a moment|cf-chl|cf_chl|challenge-platform|__cf_chl|verifying you are human/i
function looksLikeChallengePage(whole, main) {
  const blob = `${whole || ''}\n${main || ''}`.toLowerCase().trim()
  if (!blob) return false
  return isBotWall(blob) || CHALLENGE_PAGE_RE.test(blob)
}
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

// Read the rendered text. A late client-side redirect destroys the JS execution
// context mid-evaluate ("Execution context was destroyed") — that is a navigation
// race, not a dead source, so wait for the navigation to settle and read again
// instead of reporting a false `unreachable`.
async function readRendered(page) {
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const whole = await page.evaluate(() => (document.body ? document.body.innerText : ''))
      const main = await page.evaluate(() => {
        const sels = ['main', 'article', '[role="main"]', '#content', '.content', '.main-content', '#main-content']
        let best = null, bestLen = 0
        for (const s of sels) {
          const el = document.querySelector(s)
          if (el) { const t = (el.innerText || '').length; if (t > bestLen) { best = el; bestLen = t } }
        }
        return best ? best.innerText : ''
      })
      return { whole, main }
    } catch (e) {
      lastErr = e
      await page.waitForLoadState('domcontentloaded', { timeout: PROBE_TIMEOUT_MS }).catch(() => {})
      await page.waitForTimeout(1500)
    }
  }
  throw lastErr || new Error('render read failed')
}

/**
 * Wait out a WAF JS challenge, then return the first render that is no longer
 * one. Polling (not a navigation event) on purpose: the challenge reload is
 * initiated by the interstitial's own script, and some WAFs clear in place.
 *
 * A candidate is accepted only when it is (a) not a challenge page and (b)
 * identical to the next read — a challenge clears WITH a navigation, so a read
 * that races it can catch a half-hydrated body, and baselining that would make
 * every later full render look like a change. When the wall never clears we
 * return the LAST render, so `classifyProbeResult` still reports `blocked`.
 */
async function awaitChallengeClearance(page, initial) {
  const deadline = Date.now() + CHALLENGE_WAIT_MS
  let rendered = initial
  while (Date.now() < deadline) {
    await page.waitForTimeout(Math.min(1000, Math.max(1, deadline - Date.now())))
    let candidate
    try { candidate = await readRendered(page) } catch { continue }
    rendered = candidate
    if (looksLikeChallengePage(candidate.whole, candidate.main)) continue
    await page.waitForTimeout(700)
    const confirm = await readRendered(page).catch(() => null)
    if (!confirm) continue
    rendered = confirm
    if (!looksLikeChallengePage(confirm.whole, confirm.main) && confirm.whole === candidate.whole) return rendered
  }
  return rendered
}

async function browserProbe(url, settleMs = 2500) {
  return withBrowserSlot(() => browserProbeUnbounded(url, settleMs))
}

async function browserProbeUnbounded(url, settleMs = 2500) {
  const { browser, context } = await launchBrowser()
  try {
    const page = await context.newPage()
    await page.setDefaultTimeout(PROBE_TIMEOUT_MS)
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PROBE_TIMEOUT_MS })
    } catch (e) {
      // page may have partially loaded; still try to read content
    }
    await page.waitForTimeout(settleMs) // let JS settle
    let rendered = await readRendered(page)
    // A challenge page is not the page: wait it out and read once more before
    // classifying. Without this a solvable WAF wall is permanent `blocked`.
    if (looksLikeChallengePage(rendered.whole, rendered.main)) {
      rendered = await awaitChallengeClearance(page, rendered)
    }
    const whole = rendered.whole
    const main = rendered.main
    // Detect a Cloudflare / bot wall
    const bodyText = whole.toLowerCase()
    const botWalled = isBotWall(bodyText)
    const pageText = wholeText(whole)
    const rule = ruleSentences(whole)
    const mainText = wholeText(main)
    return {
      ok: true, mode: 'browser', bytes: Buffer.byteLength(whole), pdf: false, botWalled,
      textLen: pageText.length,
      whole: hashText(pageText),
      rule: rule ? hashText(rule) : null,
      main: mainText ? hashText(mainText) : null,
      ruleText: rule ? rule.slice(0, 800) : null,
    }
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Concurrency helpers
// ---------------------------------------------------------------------------
// A browser escalation is expensive AND self-defeating under load: measured
// 2026-09-15, the same Azure WAF challenge settles in ~8 s for a lone Chromium
// but 11-19 s with three at once and 17-21 s under the harness's fan-out, which
// used the HTTP limit (PROBE_CONCURRENCY, 6) for browser work too — so
// BROWSER_CONCURRENCY (3) was declared and never enforced. Gating the fan-out
// keeps challenge clearing inside CHALLENGE_WAIT_MS and keeps the run's cost
// predictable.
let browserSlots = BROWSER_CONCURRENCY
const browserQueue = []
async function withBrowserSlot(fn) {
  if (browserSlots > 0) browserSlots--
  else await new Promise(r => browserQueue.push(r))
  try { return await fn() } finally {
    const next = browserQueue.shift()
    if (next) next()
    else browserSlots++
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length); let next = 0
  async function worker() { while (next < items.length) { const i = next++; out[i] = await fn(items[i], i) } }
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () => worker())
  await Promise.all(workers); return out
}

// ---------------------------------------------------------------------------
// Baseline gate — what a probe result must be before it may be written as `ok`
// ---------------------------------------------------------------------------
/**
 * The single gate every probe result passes before it can become a baseline.
 *
 * Two failure modes are rejected here (both proven against the live monitor on
 * 2026-09-15):
 *   - a render with no measurable text: 4 URLs sat at `status: ok` with an EMPTY
 *     whole-page hash, so the next successful render read as a change in every
 *     scope (Panama and Mexico both fired rule events off exactly these);
 *   - an empty rule/main scope: sha256('') is the ABSENCE of a scope, not a
 *     baseline. 48 of 114 URLs carried it, so any future render that produced
 *     text read as a rule change and any return to empty read as another one.
 * A result that fails the gate is reported unreachable/needs-review instead.
 */
function classifyProbeResult(result) {
  if (!result || !result.ok) {
    return { ok: false, error: result?.error || 'probe failed', cloudflare: result?.cloudflare }
  }
  if (result.botWalled) {
    // Browser hit a wall — treat as probe-failure (unreachable-ish), not content.
    return { ok: false, error: 'bot-walled (WAF/challenge page — no readable content)', cloudflare: true }
  }
  if (!result.pdf && !(Number(result.textLen) >= MIN_TEXT_LEN)) {
    return { ok: false, error: `empty render (${Number(result.textLen) || 0} chars of text)` }
  }
  const out = { ...result }
  if (out.rule === EMPTY_SHA) out.rule = null
  if (out.main === EMPTY_SHA) out.main = null
  return out
}

// ---------------------------------------------------------------------------
// Probe orchestration per URL
// ---------------------------------------------------------------------------
async function probeOnce(entry, settleMs = 2500) {
  // Pin the mode on first baseline to prevent a http↔browser flip from reading
  // as a content change. Browser is the default for anything that ever needed it.
  const wantBrowser = entry.mode === 'browser'

  let result
  if (wantBrowser) {
    // The mode is pinned to browser because this URL was baselined from a
    // RENDERED page. It must still be probed — a pinned entry that skips the
    // browser produces `result === null` and can only ever report
    // `probe failed`, permanently, no matter how healthy the source is.
    try { result = await browserProbe(entry.url, settleMs) } catch (e) { result = { ok: false, error: 'browser: ' + (e?.message || e) } }
  } else {
    result = await httpProbeWithRetry(entry.url)
    if (result.cloudflare) {
      // Active bot wall — not passable from a datacenter IP; skip the browser.
      return { ok: false, error: result.error, cloudflare: true }
    }
    if (!result.ok || result.needsBrowser) {
      // escalate: try the browser (covers bot-gated / JS-only hosts)
      try { result = await browserProbe(entry.url, settleMs) } catch (e) { result = { ok: false, error: 'browser: ' + (e?.message || e) } }
    }
  }
  if (!result || !result.ok) return { ok: false, error: result?.error || 'probe failed', cloudflare: result?.cloudflare }
  return classifyProbeResult(result)
}

async function probeTarget(entry) {
  let result = await probeOnce(entry)
  // An empty render is very often transient — a CDN hiccup, a slow hydration, a
  // redirect that never completed. Only reclassify a URL as unreachable when it
  // renders nothing twice, and give the second attempt longer to hydrate.
  if (!result.ok && /^empty render/.test(result.error || '')) {
    await new Promise(r => setTimeout(r, 2500))
    const retry = await probeOnce(entry, 6000)
    if (retry.ok) result = retry
  }
  // A bot wall is a STATE too, and it is the one failure mode a WAF can clear by
  // simply being asked again on a fresh session. Measured: an Azure WAF challenge
  // under 3-way browser load settles at 17-21 s, so a single attempt used to make
  // solvable walls flap `ok`/`blocked` between consecutive runs (Cyprus moi/mof,
  // Philippines boi.gov.ph — 2026-09-15). One retry with the longer settle and
  // the full cap; a wall that is genuinely closed stays `blocked` on both
  // attempts (the cheap Cloudflare short-circuit is just re-fetched).
  if (!result.ok && result.cloudflare === true) {
    await new Promise(r => setTimeout(r, 2500))
    const retry = await probeOnce(entry, 6000)
    if (retry.ok) result = retry
  }
  return result
}

// ---------------------------------------------------------------------------
// Scope bookkeeping — write baselines, decide change vs re-baseline
// ---------------------------------------------------------------------------
/**
 * Apply a probe's scopes to an entry's stored baselines.
 * `rebaseline` writes every scope silently (used once when EXTRACT_V changes, so
 * a pipeline upgrade is never read as a corpus-wide rule change).
 * Scopes absent from this probe are DELETED — a URL with no rule text must not
 * keep an empty rule baseline lying around to be "confirmed" later.
 */
/**
 * Attribution for a whole-scope move. Layout drift is informational and never
 * alerts — but a page that moves on CONSECUTIVE runs is churn, not news, so the
 * URL plus its streak is written into the report (`layout_changed_urls`) instead
 * of leaving the next observer to re-probe 126 URLs to find out which page drifted.
 * `moved` is the same condition the report counts as `layout_changed` (a page
 * whose whole scope moved *and* whose rule scope changed reports itself as a rule
 * change instead).
 */
function noteLayout(report, p, entry, moved, changedScopes, nowIso) {
  if (!moved) { delete entry.layout_change_streak; return }
  entry.last_layout_change = nowIso
  entry.layout_change_streak = (entry.layout_change_streak || 0) + 1
  if (entry.layout_change_streak > 1) report.layout_changed_repeat_count++
  report.layout_changed_urls.push({
    program_id: p.id, name: p.name, url: entry.url,
    scopes: changedScopes || [], streak: entry.layout_change_streak,
  })
}

function applyScopes(entry, scopes, rebaseline, wholeRebaseline = false) {
  entry.scopes = entry.scopes || {}
  const present = new Set(scopes.map(s => s.key))
  for (const key of ['rule', 'main']) {
    if (!present.has(key)) delete entry.scopes[key]
  }
  const changedScopes = []
  let ruleChanged = false
  let layoutChanged = false
  for (const s of scopes) {
    const st = (entry.scopes[s.key] = entry.scopes[s.key] || {})
    const prev = st.last_hash
    const pend = st.pending_hash
    // `wholeRebaseline` re-writes ONLY the whole-page baseline: a probe-path
    // switch is a new measurement basis for the layout scope, but the rule scope
    // keeps its own comparison (its pending→confirmed gate already stops a
    // flapping page from ever confirming a rule change).
    if (prev == null || rebaseline || (wholeRebaseline && s.key === 'whole')) { st.last_hash = s.newHash; delete st.pending_hash; continue }
    if (s.newHash === prev) { delete st.pending_hash; continue }
    if (s.key === 'whole') { layoutChanged = true; st.last_hash = s.newHash; changedScopes.push(s.label); continue }
    // rule / main scope moved — confirm before alerting
    if (pend === s.newHash) { ruleChanged = true; st.last_hash = s.newHash; delete st.pending_hash; changedScopes.push(s.label) }
    else { st.pending_hash = s.newHash }
  }
  entry.rule_scope = present.has('rule') ? 'present' : 'none'
  entry.main_scope = present.has('main') ? 'present' : 'none'
  entry.extract_v = EXTRACT_V
  return { ruleChanged, layoutChanged, changedScopes }
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
    // Which URLs the `layout_changed` count is made of, with a consecutive-run
    // streak, so drift is attributable from the report alone.
    layout_changed_urls: [],
    layout_changed_repeat_count: 0,
    changed_countries: [],
    blocked_urls: [],
    unreachable_urls: [],
    by_country: [],
    // v3 bookkeeping — how many URLs carry no rule scope at all, and how many
    // baselines were silently re-written because the extraction pipeline moved.
    no_rule_scope_count: 0,
    no_rule_scope_urls: [],
    rebaselined_count: 0,
    rebaselined_urls: [],
    extract_v: EXTRACT_V,
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
      // A stored baseline of sha256('') is not content — drop it so it can never
      // be compared against a real render later.
      const stage = entry.scopes || {}
      if (stage.whole?.last_hash === EMPTY_SHA) { delete stage.whole; delete entry.last_hash }
      if (stage.rule?.last_hash === EMPTY_SHA) delete stage.rule
      const row = { program_id: p.id, name: p.name, url: entry.url, error: result.error }
      ;(isBlocked ? report.blocked_urls : report.unreachable_urls).push(row)
      continue
    }

    delete entry.status_since // recovered / probing fine

    report.ok++
    entry.last_probed = nowIso
    entry.mode = entry.mode || result.mode
    delete entry.last_error

    // ---- which scopes this probe actually carries (whole / rule / main) ----
    // An empty rule/main scope never gets here (classifyProbeResult drops it), so
    // a page with no rule text simply HAS no rule scope: recorded as
    // `rule_scope: "none"`, never baselined, never alerted on.
    const stage = entry.scopes || {}
    const isBaseline = !stage.whole?.last_hash && !entry.last_hash
    // The path this probe actually used (HTML extraction vs rendered text). The
    // whole-page hash is only comparable WITHIN a path: a URL that alternates
    // between the two reports a layout change every run (edb.gov.sg, 2026-09-15 —
    // 0 blocks via http, 11 via the render).
    const probePath = result.mode || entry.mode || 'http'
    const pathSwitched = !isBaseline && entry.probe_path != null && entry.probe_path !== probePath
    // A pipeline change is a new measurement basis, not a content change:
    // re-baseline silently once so EXTRACT_V can never fire a corpus-wide alarm.
    const rebaseline = !isBaseline && entry.extract_v !== EXTRACT_V
    const hadRuleScope = stage.rule?.last_hash != null
    const oldRuleHash = stage.rule?.last_hash

    const scopes = []
    scopes.push({ key: 'whole', label: 'Full page', newHash: result.whole })
    if (result.rule != null) scopes.push({ key: 'rule', label: 'Rule terms (fees · thresholds · requirements)', newHash: result.rule })
    if (result.main != null) scopes.push({ key: 'main', label: 'Main content', newHash: result.main })

    if (rebaseline) {
      report.rebaselined_count++
      report.rebaselined_urls.push({ program_id: p.id, name: p.name, url: entry.url })
    }

    // ---- baseline vs change (with volatility suppression) ----
    // A rule scope only ALERTS once the same new value is seen on two
    // consecutive probes (pending → confirmed). Live tickers, "last updated"
    // stamps and rotating banners settle out instead of firing every run.
    const { ruleChanged, layoutChanged, changedScopes } = applyScopes(entry, scopes, rebaseline, pathSwitched)
    entry.probe_path = probePath

    // Gaining a rule scope where there was none is information, not an alert —
    // there was no baseline to change from.
    if (!hadRuleScope && result.rule != null) {
      newEvents.push({ id: `${nowIso}-${entry.url.slice(-8)}-rule-scope`, ts: nowIso, date: today,
                       country: p.name, program_id: p.id, url: entry.url, kind: 'coverage',
                       status: 'rule scope added', before: null, after: result.ruleText?.slice(0, 220) || null })
    }

    // ---- rule-text snapshot + change event (the diff the feed shows) ----
    if (result.ruleText != null && result.rule != null) {
      const snap = (SNAP[entry.url] = SNAP[entry.url] || {})
      const before = (ruleChanged && snap.rule && snap.rule.hash === oldRuleHash) ? snap.rule.text : null
      if (ruleChanged) {
        newEvents.push({
          id: `${nowIso}-${entry.url.slice(-8)}-rule`, ts: nowIso, date: today,
          country: p.name, program_id: p.id, url: entry.url, kind: 'rule',
          scopes: changedScopes, before, after: result.ruleText.slice(0, 220),
        })
      }
      if (rebaseline || !(snap.rule && snap.rule.hash === oldRuleHash && !ruleChanged)) {
        snap.rule = { hash: entry.scopes.rule.last_hash, text: result.ruleText }
      }
    } else {
      // No rule scope → whatever was stored as "rule text" was chrome or nothing.
      delete SNAP[entry.url]
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
    // Attribute the whole-scope move (or clear the streak) — this is what makes
    // `layout_changed` actionable without a follow-up probe run.
    noteLayout(report, p, entry, layoutChanged && !ruleChanged, changedScopes, nowIso)

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
      // Explicit, so "this URL has no rule text" is visible rather than inferred
      // from an empty hash.
      rule_scope: u.rule_scope || (u.scopes?.rule?.last_hash ? 'present' : 'none'),
      extract_v: u.extract_v || null,
      last_error: u.last_error || null,
    }))
    const gap = Math.max(0, ...urls.map(u => u.coverage_gap_days || 0))
    if (gap > 0) coverageGapCountries++
    for (const u of urls) {
      if (u.rule_scope !== 'present') {
        report.no_rule_scope_count++
        report.no_rule_scope_urls.push({ program_id: p.id, name: p.name, url: u.url, status: u.status || null })
      }
    }
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

  console.log(`✓ Source probe v2 (extract v${EXTRACT_V}) — ${targets.length} URLs · ok ${report.ok} · rule-changed ${report.changed} · ` +
    `layout-changed ${report.layout_changed} · cloudflare-blocked ${report.cloudflare_blocked} · unreachable ${report.unreachable} · ` +
    `no-rule-scope ${report.no_rule_scope_count} · rebaselined ${report.rebaselined_count}${DRY_RUN ? ' (dry-run)' : ''}`)
  if (report.changed_countries.length) {
    console.log('  RULE CHANGED:', report.changed_countries.map(c => `${c.name} [${c.scopes.join('|')}]`).join(', '))
  }
  if (report.blocked_urls.length) {
    console.log('  CLOUDFLARE-BLOCKED (need alternate official source):', report.blocked_urls.map(u => u.name).join(', '))
  }
  if (report.unreachable_urls.length) {
    console.log('  UNREACHABLE:', report.unreachable_urls.map(u => `${u.name} [${u.error}]`).join(', '))
  }
  if (report.layout_changed_urls.length) {
    console.log(`  LAYOUT-CHANGED (informational — which pages drifted${report.layout_changed_repeat_count ? `, ${report.layout_changed_repeat_count} on a consecutive run` : ''}): ` +
      report.layout_changed_urls.map(u => `${u.name} [${u.url.replace(/^https?:\/\//, '')}${u.streak > 1 ? ` ×${u.streak}` : ''}]`).join(', '))
  }
}

// ---------------------------------------------------------------------------
// Self-test — `node scripts/probe-sources.mjs --self-test`
// ---------------------------------------------------------------------------
// Pure assertions over the extraction pipeline and the baseline gate, so the two
// failure modes fixed on 2026-09-15 cannot silently come back:
//   A. an empty rule/main scope was baselined, then "confirmed" as a rule change
//   B. a page that rendered to zero text was written as `ok`
// v6 additions (2026-09-15 layout-churn attribution):
//   C. a marquee that only re-orders identical blocks is not a page change
//   D. machine stamps (request ids, WAF incident ids, CDN cache-busters, load
//      countdowns) are churn; a rule sentence carrying a deadline time is not
//   E. a dateline (live clock in EN/ES/CA/FR/DE/IT/PT) leaves the whole scope
//   F. a fee-table amount reaches the rule scope; a bare figure stays churn
//   G. a WAF / bot-challenge page is reported blocked, never baselined as content
//   H. `layout_changed_urls` names the drifted URL and its consecutive-run streak
// No network. The last check runs a loopback fixture and skips without Chromium.
let failures = 0
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ok   ${name}`)
  } else {
    failures++
    console.log(`  FAIL ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`)
  }
}

async function selfTest() {
  console.log(`probe-sources self-test (extract v${EXTRACT_V})`)
  check('sha256("") is the empty-scope sentinel',
    EMPTY_SHA === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')

  // --- the gate -----------------------------------------------------------
  const empty = classifyProbeResult({ ok: true, mode: 'browser', pdf: false, textLen: 0, whole: EMPTY_SHA, rule: EMPTY_SHA, main: EMPTY_SHA, ruleText: null })
  check('an empty render is NOT ok', empty.ok === false && /empty render/.test(empty.error || ''), empty)
  const thin = classifyProbeResult({ ok: true, pdf: false, textLen: 12, whole: 'x', rule: null, main: null })
  check('text below the threshold is NOT ok', thin.ok === false && /empty render/.test(thin.error || ''), thin)
  const noRule = classifyProbeResult({ ok: true, pdf: false, textLen: 5000, whole: 'w', rule: EMPTY_SHA, main: EMPTY_SHA, ruleText: '' })
  check('an empty rule/main scope becomes "no scope"', noRule.ok === true && noRule.rule === null && noRule.main === null, noRule)
  const pdf = classifyProbeResult({ ok: true, pdf: true, mode: 'http', bytes: 900, whole: 'p', rule: null, main: null })
  check('a PDF is still a valid baseline (no text-length check)', pdf.ok === true, pdf)
  const wall = classifyProbeResult({ ok: true, pdf: false, textLen: 900, whole: 'w', botWalled: true })
  check('a bot wall is still a probe failure', wall.ok === false && wall.cloudflare === true, wall)

  // --- extraction ---------------------------------------------------------
  const chromePage = `<html><head><title>t</title><style>.wp-block-button__link{color:#fff}</style>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite"}</script></head>
    <body><nav><ul><li>Publications</li><li>Legislation</li><li>Consultations</li><li>FAQs</li></ul></nav>
    <div class="eu-cookie-compliance-more-button">Accept all cookies</div>
    <div>Central Bank announces appointment of new Director of Strategy and Governance 15 September 2026 • Press Release</div>
    <div>2.25% Deposit Facility · 2.40% Main Refinancing Operations</div></body></html>`
  const chromeRule = ruleSentences(chromePage)
  check('a chrome-only page yields NO rule scope', chromeRule === '', chromeRule)
  check('CSS / JSON-LD / nav never reach the whole scope',
    !/wp-block-button|schema\.org|Publications/.test(wholeText(chromePage)), wholeText(chromePage))

  const jp = `<html><body><p>令和８年１０月１日から在留資格の変更の許可及び永住許可に係る手数料の額が改定されます。</p>
    <p>在留期間の更新の許可については、手数料が必要です。</p></body></html>`
  const jpRule = ruleSentences(jp)
  check('a Japanese render yields rule text (CJK splitter + terms)', jpRule.length > 0 && /手数料/.test(jpRule), jpRule)
  check('…and its sentences are split on 。', jpRule.split('。').length >= 2, jpRule)

  const rulePage = `<html><body><p>The minimum investment is USD 250,000 for the golden visa, and applicants must reside 30 days per year.</p>
    <div>Gebühr: 100 EUR</div><p>La tarifa de solicitud es de 250 euros y el monto mínimo de inversión es 500.000 dólares.</p></body></html>`
  const ruleText = ruleSentences(rulePage)
  check('EN / DE / ES rule sentences are kept',
    /250,000/.test(ruleText) && /Gebühr/.test(ruleText) && /inversión/.test(ruleText), ruleText)

  const navOnly = ruleSentences('<html><body><nav><a>Apply for an employment permit</a></nav><a>Management of Investment Assets</a><a>Notification Requirement for Payment Service Providers</a></body></html>')
  check('nav labels that merely contain a rule word are dropped', navOnly === '', navOnly)
  const repeatedChrome = ruleSentences(`<html><body>
    <p>Applications for citizenship must be submitted in person at the designated office</p>
    <p>Applications for citizenship must be submitted in person at the designated office</p>
    <p>The minimum investment is USD 250,000.</p></body></html>`)
  check('repeated site chrome is dropped while a stated rule survives',
    /250,000/.test(repeatedChrome) && !/Applications for citizenship/.test(repeatedChrome), repeatedChrome)

  // --- the writer ---------------------------------------------------------
  // FIX A — a URL whose only rule baseline is sha256('') must lose that baseline.
  const entryA = { url: 'https://x', scopes: { whole: { last_hash: 'w0' }, rule: { last_hash: EMPTY_SHA } }, last_hash: 'w0' }
  const rA = applyScopes(entryA, [{ key: 'whole', label: 'Full page', newHash: 'w0' }], false)
  check('an empty rule baseline is deleted, never confirmed',
    entryA.scopes.rule === undefined && entryA.rule_scope === 'none' && rA.ruleChanged === false, entryA.scopes)

  // FIX C/D — chrome-only rule text (nav, CSS) disappearing must not alert.
  const entryC = { url: 'https://y', scopes: { whole: { last_hash: 'w0' }, rule: { last_hash: 'nav-v1' } }, last_hash: 'w0' }
  const rC = applyScopes(entryC, [{ key: 'whole', label: 'Full page', newHash: 'w0' }], false)
  check('losing a chrome-only rule scope cannot fire a rule change',
    rC.ruleChanged === false && entryC.rule_scope === 'none', rC)

  // A pipeline upgrade re-baselines silently instead of firing once per URL.
  const entryB = { url: 'https://z', extract_v: 2, scopes: { whole: { last_hash: 'old' }, rule: { last_hash: 'oldr' } }, last_hash: 'old' }
  const rB = applyScopes(entryB, [{ key: 'whole', label: 'Full page', newHash: 'new' }, { key: 'rule', label: 'Rule terms', newHash: 'newr' }], true)
  check('an EXTRACT_V change re-baselines silently, never alerts',
    rB.ruleChanged === false && rB.layoutChanged === false && entryB.scopes.rule.last_hash === 'newr' && entryB.extract_v === EXTRACT_V, rB)

  // A real rule movement still alerts once confirmed.
  const entryD = { url: 'https://v', extract_v: EXTRACT_V, scopes: { whole: { last_hash: 'w0' }, rule: { last_hash: 'r0', pending_hash: 'r1' } }, last_hash: 'w0' }
  const rD = applyScopes(entryD, [{ key: 'whole', label: 'Full page', newHash: 'w0' }, { key: 'rule', label: 'Rule terms', newHash: 'r1' }], false)
  check('a confirmed rule movement still alerts', rD.ruleChanged === true && entryD.scopes.rule.last_hash === 'r1', rD)

  // A probe-path switch (http ↔ render) is a new measurement basis for the layout
  // scope only: the whole baseline is re-written silently, while the rule scope
  // keeps comparing.
  const entryP = { url: 'https://p2', extract_v: EXTRACT_V, probe_path: 'http', scopes: { whole: { last_hash: 'w0' }, rule: { last_hash: 'r0' } } }
  const rP = applyScopes(entryP,
    [{ key: 'whole', label: 'Full page', newHash: 'w1' }, { key: 'rule', label: 'Rule terms', newHash: 'r0' }], false, true)
  check('a probe-path switch re-baselines the whole scope without a layout event',
    rP.layoutChanged === false && entryP.scopes.whole.last_hash === 'w1', rP)
  const rP2 = applyScopes(entryP,
    [{ key: 'whole', label: 'Full page', newHash: 'w2' }, { key: 'rule', label: 'Rule terms', newHash: 'r1' }], false, false)
  check('…while a real whole-scope move on a stable path still counts',
    rP2.layoutChanged === true && entryP.scopes.rule.pending_hash === 'r1', rP2)

  // --- v6: churn classes measured on the live corpus (t_50cbc2d3) ----------
  // C. order-only rotation (edbmauritius.org's sector marquee) is not a change.
  const orderA = wholeText('<html><body><div>Alpha team</div><div>Bravo team</div><div>Charlie team</div></body></html>')
  const orderB = wholeText('<html><body><div>Charlie team</div><div>Alpha team</div><div>Bravo team</div></body></html>')
  check('a rail that only re-orders identical blocks is NOT a page change',
    orderA === orderB && hashText(orderA) === hashText(orderB), { orderA, orderB })
  check('…adding or removing a block still moves the whole scope',
    wholeText('<html><body><div>Alpha team</div></body></html>') !==
    wholeText('<html><body><div>Alpha team</div><div>Bravo team</div></body></html>'))

  // --- v7: the RULE scope is a sorted set too (t_8b9ff3c4) ------------------
  // Same defect class as the marquee-order one above, but for `rule`: the scope
  // was joined in DOM order, so a page that re-ordered two rule sentences moved
  // the rule hash and fired a false rule-changed (measured on invest.gov.tr).
  const ruleOrderA = ruleSentences('<html><body>' +
    '<p>The minimum investment is USD 250,000 and applicants must reside 30 days per year.</p>' +
    '<p>The application fee is 100 EUR.</p></body></html>')
  const ruleOrderB = ruleSentences('<html><body>' +
    '<p>The application fee is 100 EUR.</p>' +
    '<p>The minimum investment is USD 250,000 and applicants must reside 30 days per year.</p></body></html>')
  check('a re-ordered rule sentence is NOT a rule change',
    ruleOrderA.length > 0 && ruleOrderA === ruleOrderB && hashText(ruleOrderA) === hashText(ruleOrderB),
    { ruleOrderA, ruleOrderB })
  check('…editing a rule figure still moves the rule scope',
    ruleSentences('<html><body>' +
      '<p>The minimum investment is USD 350,000 and applicants must reside 30 days per year.</p>' +
      '<p>The application fee is 100 EUR.</p></body></html>') !== ruleOrderA)

  // --- v7: the WAF challenge is a STATE to wait out, not a page -------------
  // Azure WAF serves exactly this body at settleMs=2500 on the Cyprus Migration
  // Department's Regulation 6(2) page; the challenge clears at ~8 s.
  const challengeBody = "One moment, we're checking you're not a bot.\n20260915T174343Z-r1b89f57c95twsglhC1FRAwh5000000004zg000000006sd4"
  check('the WAF challenge interstitial is recognised as a page to wait out',
    looksLikeChallengePage(challengeBody, '') === true, challengeBody)
  check('…an empty render is not a challenge (it has its own retry path)',
    looksLikeChallengePage('', '') === false)
  check('…the cleared gov.cy render is not a challenge',
    looksLikeChallengePage('Skip to main content\nCookies on gov.cy', 'Criteria for granting an Immigration Permit') === false)
  check('…and an ordinary rule page is never mistaken for one',
    looksLikeChallengePage('Applicants must show a minimum investment of EUR 300,000. Access denied to the platform is appealable.', '') === false)
  // The trap this guards: folding the Azure markers into BOT_WALL_RE would make
  // CF_MARKERS match the 403 and skip the browser escalation in probeOnce —
  // i.e. the wall would be terminal again, the exact defect being fixed.
  const azure403Body = '<html><head><title>Azure WAF</title></head><body>' +
    '<p>Please enable JavaScript to run this application. An unexpected error occured.</p>' +
    '<span id="azure-ref">20260915T174018Z-r1b89f57c95dndwmhC1FRA3wg40000000bcg00000000krg9</span></body></html>'
  check('…an Azure 403 body still escalates to the browser',
    CF_MARKERS.test(azure403Body.slice(0, 4000)) === false &&
    looksLikeChallengePage('Please enable JavaScript to run this application.', '') === true)
  // v7 — browser work is gated on the DECLARED limit. It used to run on the HTTP
  // fan-out (6), and that load is what made the WAF challenge exceed the wait.
  let inFlight = 0, maxInFlight = 0
  await Promise.all(Array.from({ length: BROWSER_CONCURRENCY + 3 }, () => withBrowserSlot(async () => {
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight)
    await new Promise(r => setTimeout(r, 25))
    inFlight--
  })))
  check(`browser probes are capped at BROWSER_CONCURRENCY (${BROWSER_CONCURRENCY})`,
    maxInFlight === BROWSER_CONCURRENCY && inFlight === 0 && browserQueue.length === 0, { maxInFlight })
  check('…and the slots are released, so a later probe still runs',
    await withBrowserSlot(async () => true) === true)

  // D. machine stamps are churn — every string below was observed live on
  // 2026-09-15 and moved the whole-scope hash between two back-to-back probes.
  const stamps = [
    ['WP nonce (boi.gov.ph)', '8fe74e64e143c03fad5081e1e50beac3'],
    ['request stamp (moi/mof.gov.cy)', '20260915T155544Z-r1b89f57c95lbsm9hC1FRA47t00000001du000000000bp31'],
    ['CDN cache-buster (inclusion.gob.es)', '0.cf8c655f.1789487834.29261e58'],
    ['WAF incident id (bnb.bg)', 'The incident ID is: 7675314743632885536.'],
    ['load countdown (thaievisa.go.th)', 'Acknowledge (9s)'],
  ]
  for (const [label, s] of stamps) check(`churn: ${label}`, isChurn(s) === true, s)
  check('…a rule sentence that carries a deadline time is NOT churn',
    isChurn('Applications close on 30 November 2026 at 23:59:59 CET for the golden visa') === false)
  check('…a rule sentence naming an incident/reference is NOT churn',
    isChurn('The applicant must submit a reference number issued by the immigration office with the application') === false)
  // …and the LIVE CLOCK variants (a dateline, not a stamp) never reach the whole scope.
  const datelines = [
    ['mfa.bg', '<div>September 15 2026, 15:57:41 UTC</div>'],
    ['rree.go.cr', '<div>Costa Rica, Martes 15 de Setiembre de 2026 6:19:41 p.m.</div>'],
    ['govern.ad', '<div>Dimarts, 15 de setembre del 2026 | 18:19:45</div>'],
  ]
  for (const [label, html] of datelines) {
    check(`whole scope drops the live clock on ${label}`, wholeText(html) === '', wholeText(html))
  }
  check('…but a rule sentence that carries a deadline time stays in the whole scope',
    /Applications close/.test(wholeText('<div>Applications close on 30 November 2026 at 23:59:59 CET for the golden visa</div>')),
    wholeText('<div>Applications close on 30 November 2026 at 23:59:59 CET for the golden visa</div>'))

  // G. a bot challenge / WAF block page is not content and not a page change.
  const walls = [
    ["One moment, we're checking you're not a bot.", 'moi/mof.gov.cy'],
    ['Just a moment...', 'cloudflare'],
    ['You reached this page when trying to access https://www.mfa.bg/ from 169.58.32.160 on September 15 2026, 16:19:33 UTC', 'mfa.bg (Radware)'],
    ["Error Error Error This page can't be displayed. Contact support for additional information. The incident ID is: 7675314743632904247.", 'bnb.bg'],
    ['Acceso denegado 🚫 Por favor, intente de nuevo. Código de error: 0.cf8c655f.1789489435.29492f84 Dirección IP: 2a02:c207:2344:6772::1', 'inclusion.gob.es'],
  ]
  for (const [text, label] of walls) check(`wall: ${label}`, isBotWall(text.toLowerCase()) === true, text)
  check('…an ordinary rule page is not mistaken for a wall',
    isBotWall('Applicants must show a minimum investment and pay the application fee. Access denied to the platform is appealable.'.toLowerCase()) === false &&
    isBotWall('access denied') === false &&
    isBotWall('access denied — ip address: 2a02:c207::1, error code: 123') === true)
  const walled = classifyProbeResult({ ok: true, pdf: false, textLen: 44, whole: 'w', botWalled: true })
  check('…and is reported blocked, not as a content baseline',
    walled.ok === false && walled.cloudflare === true, walled)

  // E. money figures are rule content in the RULE scope; a bare figure stays
  // churn in the whole scope (counters drift, fee labels do not).
  const feePage = '<html><body><div>Application fee for a specified scheme: $ 1,300</div>' +
    '<div>Issuance fee (over 180 days)</div><div>HK$600</div><div>3,463,022</div><div>2.25%</div></body></html>'
  check('a bare figure and a rate are churn, a fee amount reaches the rule scope',
    isChurn('3,463,022') === true && isChurn('2.25%') === true && isChurn('1.0865') === true &&
    /\$ 1,300/.test(ruleSentences(feePage)), { rule: ruleSentences(feePage) })
  check('…a fee edit moves both scopes',
    wholeText(feePage) !== wholeText(feePage.replace('$ 1,300', '$ 1,400')) &&
    ruleSentences(feePage) !== ruleSentences(feePage.replace('$ 1,300', '$ 1,400')))

  // F. layout drift is attributed per URL, with a consecutive-run streak.
  const rep = { layout_changed_urls: [], layout_changed_repeat_count: 0 }
  const pale = { url: 'https://p' }
  const prow = { id: 7, name: 'Testland' }
  noteLayout(rep, prow, pale, true, ['Full page'], 'T1')
  noteLayout(rep, prow, pale, true, ['Full page'], 'T2')
  noteLayout(rep, prow, pale, false, null, 'T3')
  check('a clean run clears the layout streak', pale.layout_change_streak === undefined, pale)
  noteLayout(rep, prow, pale, true, ['Full page'], 'T4')
  check('layout_changed_urls names the URL, the scope and the streak',
    rep.layout_changed_urls.length === 3 && rep.layout_changed_urls.every(r => r.url === 'https://p' && r.name === 'Testland') &&
    rep.layout_changed_urls[0].streak === 1 && rep.layout_changed_urls[1].streak === 2 &&
    rep.layout_changed_urls[2].streak === 1 && rep.layout_changed_repeat_count === 1, rep)

  // --- end-to-end: a live fixture that renders to nothing -------------------
  try {
    const httpMod = await import('node:http')
    const server = httpMod.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end('<html><head><title>fixture</title></head><body></body></html>')
    })
    await new Promise(r => server.listen(0, '127.0.0.1', r))
    const url = `http://127.0.0.1:${server.address().port}/`
    let browserReady = true
    try { const b = await launchBrowser(); await b.browser.close() } catch { browserReady = false }
    if (!browserReady) {
      console.log('  skip loopback fixture assertion — no Chromium available')
    } else {
      const res = await probeTarget({ url })
      check('live: a page that renders to nothing is NOT ok', res.ok === false && /empty render/.test(res.error || ''), res)
    }
    server.close()

    // --- end-to-end: a WAF challenge that CLEARS by navigation --------------
    // The shape of the Azure WAF challenge, measured on the Cyprus Migration
    // Department's page: 403 + a JS interstitial, then the same URL with an auth
    // token returns the real page. The engine's first read at settleMs sees the
    // wall; the fix must wait it out and baseline the CONTENT.
    let challengeServed = false
    const server2 = httpMod.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1')
      if (u.pathname !== '/') { res.writeHead(204); res.end(); return }
      if (!u.searchParams.get('afd_azwaf_tok')) {
        challengeServed = true
        res.writeHead(403, { 'content-type': 'text/html' })
        res.end('<html><head><title>Azure WAF</title></head><body>' +
          '<p>Please enable JavaScript to run this application. An unexpected error occured.</p>' +
          '<span>20260915T174343Z-r1b89f57c95fixture000000000000</span>' +
          '<script>setTimeout(function(){location.replace("/?afd_azwaf_tok=fixture")},4000)</script></body></html>')
      } else {
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end('<html><head><title>Immigration Permits for Investors</title></head><body><main>' +
          '<p>In line with Regulation 6(2), the minimum investment is EUR 300,000 and the required annual income is EUR 50,000.</p>' +
          '</main></body></html>')
      }
    })
    await new Promise(r => server2.listen(0, '127.0.0.1', r))
    const chUrl = `http://127.0.0.1:${server2.address().port}/`
    if (!browserReady) {
      console.log('  skip challenge fixture assertion — no Chromium available')
    } else {
      const ch = await probeTarget({ url: chUrl })
      check('live: a challenge that clears is baselined as CONTENT, not as a wall',
        ch.ok === true && ch.botWalled === false && /300,000/.test(ch.ruleText || ''), ch)
      check('…and the fixture really did serve the challenge first', challengeServed === true)
    }
    server2.close()
  } catch (err) {
    console.log('  skip loopback fixture assertion —', err?.message || err)
  }

  console.log(failures === 0 ? '✓ self-test passed' : `✗ self-test FAILED (${failures})`)
  return failures
}

if (process.argv.includes('--self-test')) {
  const failed = await selfTest()
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
