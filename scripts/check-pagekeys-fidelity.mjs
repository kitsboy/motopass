#!/usr/bin/env node
/* Fidelity check: the new pageKeys/<lang>.ts files must reproduce the exact
   pageKeysX content from git HEAD:src/i18n/pageKeys.ts. */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const original = execSync('git show HEAD:src/i18n/pageKeys.ts', { cwd: ROOT }).toString()
const lines = original.split('\n')

const marks = { en: 243, es: 1017, fr: 1791, pt: 2565, zh: 3339, ar: 4115, sw: 4890, de: 5667, ja: 6440, hi: 7214 }
const present = ['en', 'es', 'fr', 'pt', 'zh', 'ar', 'sw', 'de', 'ja', 'hi']

let allOk = true
for (let i = 0; i < present.length; i++) {
  const lang = present[i]
  const startIdx = marks[lang] - 1
  const nextStartIdx = i + 1 < present.length ? marks[present[i + 1]] - 1 : lines.length
  let expectedBody = lines.slice(startIdx, nextStartIdx).join('\n').replace(/\n+$/, '')
  // trim leaked trailing doc comments (same as splitter)
  const bl = expectedBody.split('\n')
  while (bl.length && (bl[bl.length - 1].trim() === '' || /^\/\*\*|\*$|^\*/.test(bl[bl.length - 1].trim()))) bl.pop()
  expectedBody = bl.join('\n').replace(/\n+$/, '')

  const actual = readFileSync(resolve(ROOT, `src/i18n/pageKeys/${lang}.ts`), 'utf8').trim()
  const actualBody = lang === 'en'
    ? actual.split('\n').slice(marks.en - 1).join('\n').trim() // from `export const pageKeysEn`
    : actual.split('\n').slice(2).join('\n').trim() // skip import lines

  const match = actualBody === expectedBody
  if (!match) { allOk = false; console.log(`✗ ${lang} MISMATCH`) }
  else console.log(`✓ ${lang} faithful (${expectedBody.split('\n').length} lines)`)
}
console.log(allOk ? '\nALL FAITHFUL' : '\nFAILED')
process.exit(allOk ? 0 : 1)
