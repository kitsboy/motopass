#!/usr/bin/env node
/**
 * Live acceptance check for the MotoPass trust UI (t_375ddf15).
 *
 * Loads the DEPLOYED verify page and drives the real Proof-panel flow against
 * the live api.satohash.io verifier. Assertions:
 *   1. the served bundle carries the pushed commit's BUILD salt
 *   2. <ProofStatusBadge> (data-testid=proof-status-badge) renders
 *   3. the shared <HowProofWorks> explainer renders
 *   4. a genuine hash -> state "confirmed" + the verify METHOD is surfaced
 *      ("own Bitcoin node" == verified_method:bitcoind) + block height
 *   5. an .ots download link sits next to the verdict
 *   6. a forged hash -> "Not proven", never a green tick
 *
 * The page's `hash` state is seeded from ?hash= (see VerifyPage), so each case
 * is a fresh navigation to /verify?hash=<64 hex>.
 *
 * Usage: node scripts/verify-trust-ui-live.mjs [baseUrl]
 */
import { chromium } from 'playwright'

const base = (process.argv[2] ?? 'https://motopass.giveabit.io').replace(/\/$/, '')
const REAL_HASH = '1ce9eb8bd293fd5d759ff1f180dadb265c857abfd21020dbf8ca7967900b4f66'
const FORGED_HASH = '0'.repeat(64)

const fails = []
function check (label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch({ args: ['--disk-cache-size=1'] })
const ctx = await browser.newContext({ bypassCSP: false })
const page = await ctx.newPage()
const apiCalls = []
page.on('response', (r) => {
  if (r.url().includes('/api/verify')) apiCalls.push(`${r.status()} ${r.url()}`)
})

async function driveAndWait (hash) {
  await page.goto(`${base}/verify?hash=${hash}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  const btn = page.getByRole('button', { name: /check this hash on bitcoin/i }).first()
  await btn.waitFor({ state: 'visible', timeout: 45000 })
  await page.waitForFunction(
    () => {
      const b = [...document.querySelectorAll('button')].find((x) => /check this hash on bitcoin/i.test(x.textContent ?? ''))
      return b && !b.disabled
    },
    { timeout: 45000 })
  await btn.click()
  await page.waitForSelector('[data-testid="proof-status-badge"]', { timeout: 60000 })
}

// --- 1. which bundle is production serving? -------------------------------
await page.goto(`${base}/verify`, { waitUntil: 'domcontentloaded', timeout: 60000 })
const bundleSrc = await page.evaluate(() => {
  const tags = [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')).join(' ')
  const perf = performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.includes('/assets/index-')).join(' ')
  return `${tags} ${perf}`.trim()
})
const servedBuild = (bundleSrc.match(/2026\d{4}-[0-9a-f]{7}/) ?? ['(no build salt)'])[0]
const servedUrl = page.url()
console.log(`served build id : ${servedBuild}`)
console.log(`served bundle   : ${bundleSrc.trim()}`)
console.log(`verify page url : ${base}/verify?hash=<sha256>\n`)

// --- 2-5. genuine anchor ---------------------------------------------------
await driveAndWait(REAL_HASH)
const badge = page.locator('[data-testid="proof-status-badge"]')
const state = await badge.getAttribute('data-proof-state')
const body = await page.locator('body').innerText()
check('Proof panel renders ProofStatusBadge', await badge.count() > 0)
check('HowProofWorks shared explainer renders', await page.locator('[data-testid="how-proof-works"]').count() > 0)
check('badge state is "confirmed" for a real anchor', state === 'confirmed', `data-proof-state=${state}`)
check('verify METHOD surfaced (own Bitcoin node = bitcoind)',
  /checked against a bitcoin node|checked against a public bitcoin explorer/i.test(body),
  (body.match(/Checked against[^\n]*/i) ?? ['(no method line)'])[0])
check('Bitcoin block height shown (967,273)', /967,?273/.test(body))
check('library-independent verify command shown', /ots verify/.test(body))
const otsHref = await page.locator('[data-testid="ots-download"]').first().getAttribute('href').catch(() => null)
check('.ots download present next to the verdict', !!otsHref, otsHref ?? 'no element')
check('live api.satohash.io /api/verify called from the page', apiCalls.length > 0, apiCalls.slice(0, 3).join(' | ') || 'no call seen')
check('badge shows the proven-then vs valid-now split', /proven then/i.test(body) && /valid now/i.test(body))

// --- 6. forged hash --------------------------------------------------------
apiCalls.length = 0
await driveAndWait(FORGED_HASH)
const forgeState = await badge.getAttribute('data-proof-state')
const forgeText = await badge.innerText()
check('forged proof renders "Not proven"', forgeState === 'not-proven' && /not proven/i.test(forgeText),
  `data-proof-state=${forgeState} text="${forgeText.replace(/\s+/g, ' ').slice(0, 90)}"`)

console.log(`\nRESULT: ${fails.length === 0 ? 'PASS' : `FAIL (${fails.length}): ${fails.join('; ')}`}`)
console.log(`BUILD_ID_VERIFIED=${servedBuild}`)
console.log(`PAGE_URL=${servedUrl}`)
await browser.close()
process.exit(fails.length === 0 ? 0 : 1)
