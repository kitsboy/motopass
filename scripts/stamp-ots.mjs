#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const proofsDir = resolve(root, 'public/proofs')
const CALENDAR_URIS = [
  'https://a.pool.opentimestamps.org',
  'https://b.pool.opentimestamps.org',
  'https://finney.calendar.eternitywall.com/ots',
]
const SKIP_NETWORK = process.env.OTS_SKIP_NETWORK === '1'
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
function canonicalSlice(program) {
  const slice = {
    id: program.id,
    name: program.name,
    finance: program.finance,
    pathways: program.pathways,
    critical_tests: program.critical_tests,
    legal_compliance: program.legal_compliance,
    compliance_clock: program.compliance_clock,
    last_checked: program.last_checked,
  }
  return JSON.stringify(slice, Object.keys(slice).sort())
}
async function loadOpenTimestamps() {
  const mod = await import('opentimestamps')
  return mod.default ?? mod
}
async function main() {
  mkdirSync(proofsDir, { recursive: true })
  const OpenTimestamps = await loadOpenTimestamps()
  const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
  let stamped = 0
  for (const program of data.programs) {
    if (!program.flagship_depth) continue
    const proof = program.satohash_proofs?.[0]
    if (!proof) continue
    const hashHex = createHash('sha256').update(canonicalSlice(program)).digest('hex')
    const otsFileName = `${slugify(program.name)}-${hashHex.slice(0,12)}.ots`
    const otsAbsPath = resolve(proofsDir, otsFileName)
    const otsPublicPath = `/proofs/${otsFileName}`
    if (existsSync(otsAbsPath)) {
      proof.ots_path = otsPublicPath
      stamped++
      continue
    }
    try {
      const hashBuf = Buffer.from(hashHex, 'hex')
      const detached = OpenTimestamps.DetachedTimestampFile.fromHash(new OpenTimestamps.Ops.OpSHA256(), hashBuf)
      if (!SKIP_NETWORK) {
        await OpenTimestamps.stamp(detached, CALENDAR_URIS)
      }
      const otsBytes = detached.serializeToBytes()
      writeFileSync(otsAbsPath, Buffer.from(otsBytes))
      proof.ots_path = otsPublicPath
      proof.stamped_at = new Date().toISOString()
      stamped++
      console.log(`✓ ${program.name} → ${otsPublicPath}`)
    } catch (err) {
      console.error(`✗ ${program.name}: ${err.message}`)
    }
  }
  writeFileSync(countriesPath, JSON.stringify(data, null, 2) + '\n')
  console.log(`\nDone — stamped ${stamped} files`)
}
main().catch(console.error)
