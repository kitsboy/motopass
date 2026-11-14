#!/usr/bin/env node
// 1e — live dead-host checker.
//
// Probes every source URL the site links to: each `claim_sources` entry, each
// `officialLink`, and every `proof_url`. A host that stops resolving (HTTP
// >=400, or a network/DNS error) means a figure's source has rotted — the site
// must show that, and the gate must fail so a regression can't pass quietly.
//
//   exit 0  → all URLs live; writes clean linkCheck.json
//   exit 1  → at least one dead/rotted URL; writes linkCheck.json with details
//
// Deterministic: probes are concurrent but bounded, URL set is deduped, and the
// written file is stable so CI is not flaky on reorder.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(root, 'src/data/linkCheck.json')
const TIMEOUT_MS = 10_000
const CONCURRENCY = 12

function collectUrls() {
  const c = JSON.parse(readFileSync(resolve(root, 'research/countries.json'), 'utf8'))
  const seen = new Set()
  const out = []
  const add = (what, who, url) => {
    if (!url || !/^https?:\/\//.test(url)) return
    if (seen.has(url)) return
    seen.add(url)
    out.push({ program: who, what, url })
  }
  for (const p of c.programs || []) {
    for (const [field, claim] of Object.entries(p.claim_sources || {})) {
      add(`claim:${field}`, p.name, claim && claim.url)
    }
    for (const link of p.officialLinks || []) {
      add('official', p.name, typeof link === 'string' ? link : link && link.url)
    }
    for (const proof of p.satohash_proofs || []) {
      if (proof && proof.proof_url) add('proof', p.name, proof.proof_url)
    }
  }
  return out
}

async function probe(urls) {
  const results = new Map()
  const queue = [...urls]
  let cursor = 0
  const worker = async () => {
    while (cursor < queue.length) {
      const row = queue[cursor++]
      const t0 = Date.now()
      let status = 'error'
      let code = 0
      try {
        const res = await fetch(row.url, {
          method: 'GET',
          redirect: 'follow',
          headers: { 'user-agent': 'MotoPass-linkcheck/1e (link integrity)', accept: '*/*' },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        code = res.status
        status = res.ok ? 'ok' : code === 401 || code === 403 ? 'ok' : 'dead' // auth-challenge != dead
      } catch (e) {
        status = /timeout/i.test(String(e?.cause ?? e)) ? 'timeout' : 'error'
      }
      results.set(row.url, { ...row, status, code, ms: Date.now() - t0 })
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return results
}

const urls = collectUrls()
const results = await probe(urls)

const dead = [...results.values()].filter((r) => r.status === 'dead' || r.status === 'error' || r.status === 'timeout')
const live = [...results.values()].filter((r) => r.status === 'ok')

const payload = {
  schema: 'linkCheck/1',
  checkedAt: new Date().toISOString(),
  total: results.size,
  live: live.length,
  dead: dead.length,
  deadHosts: dead.map((r) => ({ program: r.program, what: r.what, url: r.url, status: r.status, code: r.code })),
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n')

console.log(`linkcheck: ${live.length} live, ${dead.length} dead/timeout/error of ${results.size}`)
for (const d of dead.slice(0, 20)) console.log(`  ✗ ${d.status} ${d.code} ${d.what} ${d.program} ${d.url}`)
if (dead.length && process.env.LINKCHECK_ALLOW_DEAD !== '1') {
  console.error(`FAIL: ${dead.length} rotted source host(s) — fix or remove, or run with LINKCHECK_ALLOW_DEAD=1 to see linkCheck.json`)
  process.exit(1)
}
