#!/usr/bin/env node
/** Audit src for target="_blank" without rel="noopener" (batch 26 #875). */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '../src')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(path)
  }
  return out
}

const offenders = []

for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8')
  const re = /target="_blank"[^>]*>/g
  let match
  while ((match = re.exec(text)) !== null) {
    const tag = match[0]
    if (!/rel="[^"]*noopener/.test(tag)) {
      const line = text.slice(0, match.index).split('\n').length
      offenders.push(`${file.replace(SRC + '/', '')}:${line}`)
    }
  }
}

if (offenders.length) {
  console.error('FAIL: external links missing rel="noopener noreferrer":')
  for (const o of offenders) console.error(`  ${o}`)
  process.exit(1)
}

console.log('OK: all target="_blank" links include rel="noopener"')