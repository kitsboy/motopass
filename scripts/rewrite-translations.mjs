#!/usr/bin/env node
/* Rewrite translations.ts: keep the `en` dict (critical path) + TranslationKey/Dict
   types, drop the 9 inlined non-English blocks (moved to locales/<lang>.ts), and add
   a synchronous `t` that reads a lazily-registered dict with English fallback. */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const path = resolve(__dirname, '../src/i18n/translations.ts')
const text = readFileSync(path, 'utf8')
const lines = text.split('\n')

// Replace the pageKeys import: only pageKeysEn + PageKey type now (others moved out).
const importIdx = lines.findIndex(l => l.includes("from './pageKeys'"))
if (importIdx === -1) { console.error('import line not found'); process.exit(1) }
lines[importIdx] = "import { pageKeysEn, type PageKey } from './pageKeys'"

// Keep lines 0..enEnd where enEnd = index of the closing `}` of the `en` block.
// The en block is `const en: Dict = {` .. `}` right before `const es`.
const esIdx = lines.findIndex(l => /^const es: Dict = \{/.test(l))
const enEnd = esIdx - 2 // line 487 (0-indexed 486), the `}` before blank + `const es`
const head = lines.slice(0, enEnd + 1).join('\n')

const tail = `
// ── Lazy locale loading ────────────────────────────────────────────────────────
// Only \`en\` ships in the critical-path bundle. The other 9 locales are code-split
// into per-language chunks (src/i18n/locales/<lang>.ts) and registered here on
// demand by I18nProvider, so first paint no longer downloads ~755KB of translation
// data. \`t\` stays synchronous: it reads the registered dict for the active lang,
// falling back to English for any missing key.

const extraDicts: Partial<Record<LangCode, Dict>> = {}

/** Register a lazily-loaded locale dictionary (called by I18nProvider). */
export function registerDict(lang: LangCode, dict: Dict): void {
  extraDicts[lang] = dict
}

export function t(lang: LangCode, key: TranslationKey): string {
  const localized = (extraDicts[lang] ?? en)[key]
  if (localized !== undefined) return localized
  const fallback = en[key]
  if (fallback !== undefined) return fallback
  return key
}
`

writeFileSync(path, head + '\n' + tail)
console.log('translations.ts rewritten; lines now:', (head + '\n' + tail).split('\n').length)
