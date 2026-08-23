#!/usr/bin/env node
/* Split the 9 non-English locale blocks out of translations.ts into
   src/i18n/locales/<lang>.ts so each is its own lazy-loaded chunk.
   Faithful: replaces `...en,` with `...pageKeysEn,`; keeps inline + pageKeys spreads. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(__dirname, '../src/i18n/translations.ts')
const OUT_DIR = resolve(__dirname, '../src/i18n/locales')
const text = readFileSync(SRC, 'utf8')
const lines = text.split('\n')

const LANGS = ['es', 'fr', 'pt', 'zh', 'ar', 'sw', 'de', 'hi', 'ja']
const START_RE = /^const (es|fr|pt|zh|ar|sw|de|hi|ja): Dict = \{/

// find block start lines
const starts = {}
lines.forEach((l, i) => {
  const m = l.match(START_RE)
  if (m) starts[m[1]] = i
})
// find end: line of the closing `}` before the next `const <lang>: Dict` (or end of file)
const order = LANGS
for (let i = 0; i < order.length; i++) {
  const lang = order[i]
  const start = starts[lang]
  const next = i + 1 < order.length ? starts[order[i + 1]] : null
  // block content: from start line to (next ? next - 1 : line before 'export const TRANSLATIONS')
  let end
  if (next != null) {
    end = next - 1
  } else {
    // find 'export const TRANSLATIONS' line index
    const tIdx = lines.findIndex(l => l.startsWith('export const TRANSLATIONS'))
    end = tIdx - 1
  }
  // trim blank lines at end
  while (end > start && lines[end].trim() === '') end--
  // the block body: start line ('const es: Dict = {') through end (the closing '}')
  const body = lines.slice(start, end + 1)
  // replace the first `...en,` occurrence with `...pageKeysEn,`
  const outBody = body.map(l => (l.trim() === '...en,' ? '  ...pageKeysEn,' : l))
  const block = outBody.join('\n')
  const header = `import { pageKeysEn, pageKeys${lang[0].toUpperCase()}${lang.slice(1)} } from '../pageKeys'\nimport type { Dict } from '../translations'\n\n`
  const fileContent = header + block + '\n\nexport default ' + lang + '\n'
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(resolve(OUT_DIR, `${lang}.ts`), fileContent)
  console.log(`wrote src/i18n/locales/${lang}.ts (${body.length} lines)`)
}
console.log('done')
