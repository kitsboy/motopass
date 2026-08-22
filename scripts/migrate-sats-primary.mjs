#!/usr/bin/env node
/**
 * migrate-sats-primary.mjs — migrate the MotoPass data model to BTC-first.
 *
 * Every monetary figure gains a sats-primary field (e.g. min_investment_sats),
 * computed at btc_price_at_capture (read from the fx snapshot). The dataset root
 * records btc_price_at_capture + captured_at so every threshold is reconstructable:
 *     usd_at_capture = sats / 1e8 * btc_price_at_capture
 *
 * The *_usd fields are kept as the fiat-derived reference (used by USD filters and
 * schema.org SEO). Sats are the canonical stored + default-displayed unit.
 *
 * Idempotent: re-runs recompute the same values. Run:
 *   npm run fx:migrate
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SATS_PER_BTC = 100_000_000

const SNAPSHOT = JSON.parse(readFileSync(resolve(ROOT, 'public/research/fx-snapshot.json'), 'utf8'))
const CAPTURE = SNAPSHOT.btc_usd
const CAPTURED_AT = SNAPSHOT.captured_at

if (typeof CAPTURE !== 'number' || CAPTURE <= 0) {
  console.error('migrate-sats-primary: snapshot missing btc_usd — aborting.')
  process.exit(1)
}

const file = resolve(ROOT, 'research/countries.json')
const data = JSON.parse(readFileSync(file, 'utf8'))

let touched = 0
let programs = 0

function usdToSats(usd) {
  if (typeof usd !== 'number' || !Number.isFinite(usd)) return null
  return Math.round((usd / CAPTURE) * SATS_PER_BTC)
}

for (const p of data.programs ?? []) {
  programs++
  const fin = p.finance
  if (fin) {
    for (const k of ['min_investment_usd', 'typical_investment_usd', 'gov_fees_usd']) {
      if (typeof fin[k] === 'number') {
        const satsKey = k.replace('_usd', '_sats')
        const sats = usdToSats(fin[k])
        if (sats != null && fin[satsKey] !== sats) {
          fin[satsKey] = sats
          touched++
        }
      }
    }
  }
  for (const pw of p.pathways ?? []) {
    if (typeof pw.min_investment_usd === 'number') {
      const sats = usdToSats(pw.min_investment_usd)
      if (sats != null && pw.min_investment_sats !== sats) {
        pw.min_investment_sats = sats
        touched++
      }
    }
  }
}

data.btc_price_at_capture = CAPTURE
data.captured_at = CAPTURED_AT
data.currency_model = 'btc-first'

writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)

console.log(
  `migrate-sats-primary: OK — ${programs} programs, ${touched} sats fields added, anchor ${CAPTURE} @ ${CAPTURED_AT}.`,
)
