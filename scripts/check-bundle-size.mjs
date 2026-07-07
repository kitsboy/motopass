#!/usr/bin/env node
/** Fail CI if total JS bundle exceeds budget (batch 20). */
import { readdirSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '../dist/assets')
const MAX_BYTES = Number(process.env.BUNDLE_MAX_KB || 2500) * 1024

let total = 0
for (const file of readdirSync(DIST)) {
  if (file.endsWith('.js')) total += statSync(resolve(DIST, file)).size
}

const kb = (total / 1024).toFixed(1)
if (total > MAX_BYTES) {
  console.error(`Bundle ${kb} KB exceeds budget ${(MAX_BYTES / 1024).toFixed(0)} KB`)
  process.exit(1)
}
console.log(`Bundle OK: ${kb} KB (budget ${(MAX_BYTES / 1024).toFixed(0)} KB)`)