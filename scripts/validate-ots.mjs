#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const countriesPath = resolve(root, 'research/countries.json')
const publicRoot = resolve(root, 'public')
const data = JSON.parse(readFileSync(countriesPath, 'utf8'))
let failed = false
for (const program of data.programs) {
  if (!program.flagship_depth) continue
  const proof = program.satohash_proofs?.[0]
  if (!proof?.ots_path) {
    console.error(`✗ ${program.name}: missing ots_path`)
    failed = true
    continue
  }
  const otsAbs = resolve(publicRoot, proof.ots_path.replace(/^\//, ''))
  if (!existsSync(otsAbs)) {
    console.error(`✗ ${program.name}: OTS file not found at ${proof.ots_path}`)
    failed = true
  }
}
if (failed) process.exit(1)
console.log('✓ All flagship OTS files validated')
