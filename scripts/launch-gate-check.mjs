#!/usr/bin/env node
/**
 * MotoPass Launch Engine — 5-gate scorecard (v2.3)
 * Writes public/launch-gates.json for Apply page + CI.
 *
 * Usage:
 *   node scripts/launch-gate-check.mjs
 *   LAUNCH_SKIP_OPS=1 node scripts/launch-gate-check.mjs   # skip G5 subprocess checks
 *   LAUNCH_WRITE_ONLY=1 node scripts/launch-gate-check.mjs # write JSON, exit 0
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const publicRoot = resolve(root, 'public')
const outPath = resolve(publicRoot, 'launch-gates.json')

const RELAY_WSS = process.env.NOSTR_RELAY || 'wss://relay.motopass.giveabit.io'
/** Default on for local/testing — set LAUNCH_FAKE_RELAY=0 for production relay probe */
const FAKE_RELAY = process.env.LAUNCH_FAKE_RELAY !== '0'
const BUILD_ID = readBuildId()

const STUB_RE = /aaaa|placeholder|stub|demo|0000000/i
const SHA64 = /^[a-f0-9]{64}$/i

function readBuildId() {
  try {
    const src = readFileSync(resolve(root, 'src/lib/buildInfo.ts'), 'utf8')
    const m = src.match(/BUILD_ID\s*=\s*['"]([^'"]+)['"]/)
    return m?.[1] ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

function gate(id, pillar, name, pass, detail, blockers = []) {
  return { id, pillar, name, pass, detail, blockers }
}

function checkG1Seal(data) {
  const blockers = []
  let flagshipCount = 0
  let otsOk = 0

  for (const p of data.programs) {
    if (!p.flagship_depth) continue
    flagshipCount++
    const proof = p.satohash_proofs?.[0]
    if (!proof?.proof_url) {
      blockers.push(`${p.name}: missing proof_url`)
      continue
    }
    const hash = proof.proof_url.replace(/\/$/, '').split('/').pop()
    if (!SHA64.test(hash ?? '')) blockers.push(`${p.name}: invalid proof hash`)
    if (STUB_RE.test(proof.proof_url)) blockers.push(`${p.name}: stub proof URL`)
    if (proof.block_height && p.last_verified_block && proof.block_height !== p.last_verified_block) {
      blockers.push(`${p.name}: block_height mismatch`)
    }
    if (!p.pathways?.length || !p.critical_tests || !p.paige_fields) {
      blockers.push(`${p.name}: incomplete flagship schema`)
    }
    if (!proof.ots_path) {
      blockers.push(`${p.name}: missing ots_path`)
      continue
    }
    const otsAbs = resolve(publicRoot, proof.ots_path.replace(/^\//, ''))
    if (!existsSync(otsAbs)) blockers.push(`${p.name}: OTS file missing (${proof.ots_path})`)
    else otsOk++
  }

  if (flagshipCount < 50) blockers.push(`Expected 50/50 flagships, found ${flagshipCount}`)

  const pass = blockers.length === 0
  return gate(
    'G1',
    'Seal',
    'OTS + Satohash on all flagships',
    pass,
    pass ? `${flagshipCount}/50 flagships · ${otsOk} OTS on disk` : `${otsOk}/${flagshipCount} OTS ready`,
    blockers.slice(0, 8),
  )
}

function checkG2Forge(data) {
  const blockers = []
  const distressedCandidates = data.programs.filter(
    p => p.flagship_depth && p.satohash_proofs?.[0]?.proof_url && p.pathways?.length,
  ).length

  for (const rel of ['src/pages/DistressedPage.tsx', 'src/pages/VaultPage.tsx', 'src/lib/distressed/buildListings.ts']) {
    if (!existsSync(resolve(root, rel))) blockers.push(`Missing ${rel}`)
  }

  if (distressedCandidates < 40) {
    blockers.push(`Forge listings need ≥40 proof-gated programs (found ${distressedCandidates})`)
  }

  const pass = blockers.length === 0
  return gate(
    'G2',
    'Forge',
    'Distressed marketplace + proof vault UI',
    pass,
    pass ? `${distressedCandidates} listing candidates · UI routes present` : 'Forge UI incomplete',
    blockers,
  )
}

async function checkG3Nexus() {
  if (!existsSync(resolve(root, 'src/lib/nostr.ts'))) {
    return gate('G3', 'Nexus', 'Live Nostr relay (application routing)', false, 'Missing src/lib/nostr.ts', ['Missing src/lib/nostr.ts'])
  }

  if (FAKE_RELAY) {
    return gate(
      'G3',
      'Nexus',
      'Live Nostr relay (application routing)',
      true,
      `${RELAY_WSS} · FAKE relay stub (testing) — NIP-11 not probed`,
      [],
    )
  }

  const blockers = []
  const httpUrl = RELAY_WSS.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://')

  try {
    const res = await fetch(httpUrl, {
      method: 'GET',
      headers: { Accept: 'application/nostr+json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) blockers.push(`Relay NIP-11 HTTP ${res.status}`)
    else {
      const info = await res.json().catch(() => null)
      if (!info?.name && !info?.software) blockers.push('Relay NIP-11 response missing name/software')
    }
  } catch (e) {
    blockers.push(`Relay unreachable (${httpUrl}): ${e instanceof Error ? e.message : 'failed'}`)
  }

  const pass = blockers.length === 0
  return gate(
    'G3',
    'Nexus',
    'Live Nostr relay (application routing)',
    pass,
    pass ? `${RELAY_WSS} NIP-11 OK` : 'Relay not live — applications stay gated',
    blockers,
  )
}

function checkG4Ledger(data) {
  const blockers = []
  const handoff = resolve(root, 'docs/KIMI-HANDOFF.md')
  if (!existsSync(handoff)) blockers.push('Missing docs/KIMI-HANDOFF.md')
  else if (readFileSync(handoff, 'utf8').trim().length < 200) blockers.push('KIMI-HANDOFF.md too short')

  if (!data.last_updated) blockers.push('countries.json missing last_updated')
  if (!Array.isArray(data.programs) || data.programs.length < 50) {
    blockers.push(`Expected ≥50 programs, found ${data.programs?.length ?? 0}`)
  }

  const oracleSeed = resolve(root, 'research/oracle-seed.json')
  if (!existsSync(oracleSeed)) {
    blockers.push('Missing research/oracle-seed.json (Ledger oracle seed)')
  }

  const pass = blockers.length === 0
  return gate(
    'G4',
    'Ledger',
    'Oracle seed + Kimi handoff + 50-jurisdiction data',
    pass,
    pass ? `${data.programs.length} programs · oracle seed on disk` : 'Ledger ops incomplete',
    blockers,
  )
}

function checkG5Ops() {
  const blockers = []

  if (process.env.LAUNCH_SKIP_OPS === '1') {
    return gate('G5', 'Ops', 'CI validate + build artifacts', true, 'Skipped (LAUNCH_SKIP_OPS=1)', [])
  }

  const validators = [
    ['validate:data', 'node', ['scripts/validate-data.mjs']],
    ['validate:stamps', 'node', ['scripts/validate-stamps.mjs']],
    ['validate:seal', 'node', ['scripts/validate-ots.mjs']],
  ]

  for (const [label, cmd, args] of validators) {
    const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' })
    if (r.status !== 0) {
      blockers.push(`${label} failed (exit ${r.status ?? '?'})`)
    }
  }

  if (!existsSync(resolve(root, 'dist/index.html'))) {
    blockers.push('dist/index.html missing — run npm run build')
  }

  const pass = blockers.length === 0
  return gate(
    'G5',
    'Ops',
    'Data/stamp/OTS validators + production build',
    pass,
    pass ? 'validate:data · validate:stamps · validate:seal · dist OK' : 'Ops checks failing',
    blockers,
  )
}

function printScorecard(report) {
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║        MotoPass Launch Engine — Gate Scorecard           ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(`Build: ${report.build_id} · ${report.generated_at}\n`)

  for (const g of report.gates) {
    const icon = g.pass ? '✓' : '✗'
    const color = g.pass ? '\x1b[32m' : '\x1b[31m'
    console.log(`${color}${icon}\x1b[0m ${g.id} ${g.pillar.padEnd(6)} ${g.name}`)
    console.log(`    ${g.detail}`)
    for (const b of g.blockers ?? []) console.log(`    · ${b}`)
  }

  const passed = report.gates.filter(g => g.pass).length
  console.log(`\n${passed}/${report.gates.length} gates passed`)
  console.log(report.applications_open
    ? '\x1b[32mAPPLICATIONS OPEN\x1b[0m — Apply form may be enabled'
    : '\x1b[33mPRE-LAUNCH\x1b[0m — Apply form stays disabled')
  console.log(`\nWrote ${outPath}\n`)
}

async function main() {
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  const gates = [
    checkG1Seal(data),
    checkG2Forge(data),
    await checkG3Nexus(),
    checkG4Ledger(data),
    checkG5Ops(),
  ]

  const applications_open = gates.every(g => g.pass)
  const report = {
    generated_at: new Date().toISOString(),
    build_id: BUILD_ID,
    applications_open,
    relay: RELAY_WSS,
    relay_fake: FAKE_RELAY,
    relay_status: FAKE_RELAY ? 'fake' : 'live',
    gates,
  }

  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`)
  printScorecard(report)

  if (process.env.LAUNCH_WRITE_ONLY === '1') process.exit(0)
  process.exit(applications_open ? 0 : 1)
}

main().catch(err => {
  console.error('launch-gate-check failed:', err)
  process.exit(1)
})