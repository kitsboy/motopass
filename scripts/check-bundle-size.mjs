#!/usr/bin/env node
/** Fail CI if total JS bundle exceeds budget; warn if index chunk >460kb (batch 26 #874). */
import { readdirSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '../dist/assets')
const MAX_BYTES = Number(process.env.BUNDLE_MAX_KB || 2500) * 1024
const INDEX_WARN_KB = Number(process.env.INDEX_CHUNK_WARN_KB || 460)

let total = 0
let indexChunkBytes = 0

for (const file of readdirSync(DIST)) {
  if (!file.endsWith('.js')) continue
  const size = statSync(resolve(DIST, file)).size
  total += size
  if (/^index-.*\.js$/.test(file)) indexChunkBytes = Math.max(indexChunkBytes, size)
}

const kb = (total / 1024).toFixed(1)
const indexKb = (indexChunkBytes / 1024).toFixed(1)

if (indexChunkBytes > INDEX_WARN_KB * 1024) {
  console.warn(`WARN: index chunk ${indexKb} KB exceeds ${INDEX_WARN_KB} KB advisory budget`)
}

if (total > MAX_BYTES) {
  console.error(`Bundle ${kb} KB exceeds budget ${(MAX_BYTES / 1024).toFixed(0)} KB`)
  process.exit(1)
}

console.log(`Bundle OK: ${kb} KB (budget ${(MAX_BYTES / 1024).toFixed(0)} KB, index ${indexKb} KB)`)