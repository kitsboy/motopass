#!/usr/bin/env node
/**
 * Fail if dist/index.html or dist/assets/ reference a BUILD salt older than buildInfo.ts.
 * Run after `npm run build` in CI and before deploy.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function readBuildSalt() {
  const info = readFileSync(resolve(root, 'src/lib/buildInfo.ts'), 'utf8')
  const m = info.match(/BUILD_ID\s*=\s*'([^']+)'/)
  if (!m) throw new Error('Could not parse BUILD_ID from src/lib/buildInfo.ts')
  return m[1].replace(/[^a-zA-Z0-9-]/g, '')
}

const expected = readBuildSalt()
const distHtml = resolve(root, 'dist/index.html')
const assetsDir = resolve(root, 'dist/assets')

if (!existsSync(distHtml)) {
  console.error('FAIL: dist/index.html missing — run npm run build first')
  process.exit(1)
}

const html = readFileSync(distHtml, 'utf8')
const stale = new Set()

for (const m of html.matchAll(/\?b=([a-zA-Z0-9-]+)/g)) {
  if (m[1] !== expected) stale.add(`index.html ?b=${m[1]}`)
}
for (const m of html.matchAll(/\/assets\/[^"']+-(\d{8}-\d+)\.(?:js|css)/g)) {
  if (m[1] !== expected) stale.add(`index.html asset salt ${m[1]}`)
}

if (existsSync(assetsDir)) {
  for (const name of readdirSync(assetsDir)) {
    const m = name.match(/-(\d{8}-\d+)\.(js|css)$/)
    if (m && m[1] !== expected) stale.add(`dist/assets/${name}`)
  }
}

if (stale.size) {
  console.error(`FAIL: dist references stale BUILD salt (expected ${expected}):`)
  for (const item of stale) console.error(`  - ${item}`)
  process.exit(1)
}

console.log(`OK dist BUILD salt matches ${expected}`)