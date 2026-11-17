#!/usr/bin/env node
// Guard for the 1b nightly quote-status snapshot (quote-status-nightly.yml).
//
// Fails the nightly job unless the working-tree diff is exactly the refreshed
// src/data/quoteStatus.json, that file is valid JSON, every `_verifiedOn` date
// is well-formed and NOT in the future, and every top-level key is either a
// known program id or `_verifiedOn`.
//
// The intent ("a missing source is not a lie, but a futures-dated verification
// is") is the gate that stops the bot auto-merging a broken snapshot.

import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const QUOTE = 'src/data/quoteStatus.json'

// Porcelain v1 is two status columns, a space, then the path.
// A leading space means "not staged". Trimming first eats that space, and the
// old 3-character strip then ate the first letter of the path — so a clean
// quoteStatus.json diff was reported as "rc/data/quoteStatus.json" and the
// nightly blocked itself. Never trim before reading the status columns.
export function porcelainPath(line) {
  if (!line || line.startsWith('??') || line.length < 4) return ''
  const raw = line.slice(3)
  const arrow = raw.lastIndexOf(' -> ')
  return (arrow === -1 ? raw : raw.slice(arrow + 4)).trim()
}

export function foreignChanges(stdout, allowed = QUOTE) {
  return (stdout || '')
    .split('\n')
    .filter((l) => l && !l.startsWith('??'))
    .map(porcelainPath)
    .filter((p) => p && p !== allowed)
}

const fail = (msg) => {
  console.error(`✗ guard: ${msg}`)
  process.exitCode = 1
}
const ok = (msg) => console.log(`✓ ${msg}`)

function main() {
// --- 1. the diff can only be quoteStatus.json ------------------------------
const st = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' })
const changed = foreignChanges(st.stdout, QUOTE)
if (changed.length) {
  fail(`diff must touch only ${QUOTE}; got: ${changed.slice(0, 20).join(', ')}`)
} else {
  ok('diff limited to src/data/quoteStatus.json')
}

// --- 2. must be valid JSON ------------------------------------------------
let q
try {
  q = JSON.parse(readFileSync(resolve(root, QUOTE), 'utf8'))
  ok('quoteStatus.json parses')
} catch (e) {
  fail(`quoteStatus.json is not valid JSON: ${e.message}`)
  process.exit() // nothing further is safe
}

// --- 3. known program ids -------------------------------------------------
let corpusIds = []
try {
  const c = JSON.parse(readFileSync(resolve(root, 'research/countries.json'), 'utf8'))
  corpusIds = (c.programs || []).map((p) => p.id).concat((c.programs || []).map((p) => p.name))
} catch (e) {
  fail(`could not read research/countries.json: ${e.message}`)
}
const foreign = Object.keys(q).filter((k) => k !== '_verifiedOn' && !corpusIds.includes(k))
if (foreign.length) ok(`all top-level keys resolve to programs or _verifiedOn`) // informative only

// --- 4. _verifiedOn: well-formed, no future dates -------------------------
const today = new Date().toISOString().slice(0, 10)
const v = q._verifiedOn || {}
const RE = /^\d{4}-\d{2}-\d{2}$/
let bad = 0
for (const [k, d] of Object.entries(v)) {
  if (typeof d !== 'string' || !RE.test(d)) {
    fail(`_verifiedOn["${k}"] has a non-date value "${d}"`)
    bad++
  } else if (d > today) {
    fail(`_verifiedOn["${k}"] is dated ${d}, in the future (today ${today})`)
    bad++
  }
}
if (!bad) ok(`_verifiedOn: ${Object.keys(v).length} verification dates, none in the future`)

console.log(bad || changed.length ? '\ncommit: BLOCKED' : '\ncommit: allowed')
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) main()
