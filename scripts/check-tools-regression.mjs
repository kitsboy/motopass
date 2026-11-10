#!/usr/bin/env node
/**
 * Every tool card needs a regression row with a provenance label.
 * Run in CI; this is intentionally strict about coverage, not wording.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const page = readFileSync(resolve(root, 'src/pages/ToolsPage.tsx'), 'utf8')
const doc = readFileSync(resolve(root, 'docs/TOOLS-REGRESSION.md'), 'utf8')
const ids = [...new Set([...page.matchAll(/\{ id: '([a-z0-9-]+)'/g)].map(match => match[1]))]
const rows = new Map(
  [...doc.matchAll(/^\| `([a-z0-9-]+)` \|(.+)\|$/gm)].map(match => [match[1], match[2]]),
)
const provenance = /\b(Published|Live|Deterministic|Unsupported)\b/
const problems = []

for (const id of ids) {
  const row = rows.get(id)
  if (!row) problems.push(`missing regression row for ${id}`)
  else if (!provenance.test(row)) problems.push(`regression row for ${id} has no Published/Live/Deterministic provenance`)
  else if (/TODO|TBD|none/i.test(row)) problems.push(`regression row for ${id} still says TODO/TBD/none`)
}

if (doc.includes('TODO') || doc.includes('TBD')) problems.push('regression policy still contains TODO/TBD')

if (problems.length) {
  for (const problem of problems) console.error(`FAIL: ${problem}`)
  process.exit(1)
}

console.log(`Tools regression OK: ${ids.length} cards, each with fixture provenance.`)
