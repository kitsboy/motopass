#!/usr/bin/env node
/* Split pageKeys.ts into per-locale modules (fixed indexing). */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(__dirname, '../src/i18n/pageKeys.ts')
const OUT_DIR = resolve(__dirname, '../src/i18n/pageKeys')
const lines = readFileSync(SRC, 'utf8').split('\n')

// 1-indexed line numbers of each `export const pageKeysX` declaration
const marks = { en: 243, es: 1017, fr: 1791, pt: 2565, zh: 3339, ar: 4115, sw: 4890, de: 5667, ja: 6440, hi: 7214 }
const present = ['en', 'es', 'fr', 'pt', 'zh', 'ar', 'sw', 'de', 'ja', 'hi']

mkdirSync(OUT_DIR, { recursive: true })

for (let i = 0; i < present.length; i++) {
  const lang = present[i]
  const startIdx = marks[lang] - 1 // 0-indexed start of the export
  const nextStartIdx = i + 1 < present.length ? marks[present[i + 1]] - 1 : lines.length
  let body = lines.slice(startIdx, nextStartIdx).join('\n')
  // trim trailing blank lines
  body = body.replace(/\n+$/, '')
  // trim trailing doc-comment lines leaked from the NEXT export
  const bodyLines = body.split('\n')
  while (bodyLines.length && (bodyLines[bodyLines.length - 1].trim() === '' ||
    /^\/\*\*|\*$|^\*/.test(bodyLines[bodyLines.length - 1].trim()))) {
    bodyLines.pop()
  }
  body = bodyLines.join('\n').replace(/\n+$/, '')
  if (lang === 'en') {
    const head = lines.slice(0, startIdx).join('\n')
    writeFileSync(resolve(OUT_DIR, 'en.ts'), head + '\n\n' + body + '\n')
  } else {
    const decl = `import type { PageKey } from './en'\n\n`
    writeFileSync(resolve(OUT_DIR, `${lang}.ts`), decl + body + '\n')
  }
  console.log(`wrote pageKeys/${lang}.ts`)
}

// delete the original single-file pageKeys.ts (replaced by the dir)
// import { unlinkSync } from 'node:fs'
// unlinkSync(SRC)
