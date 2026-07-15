#!/usr/bin/env node
/**
 * Sync BUILD_ID / BUILD_DATE / BUILD_LABEL from src/lib/buildInfo.ts
 * across README, docs hub, changelog, and diligence frontmatter.
 *
 * Run: node scripts/sync-build-version.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function readBuildInfo() {
  const src = readFileSync(resolve(root, 'src/lib/buildInfo.ts'), 'utf8')
  const BUILD_ID = src.match(/BUILD_ID = '([^']+)'/)?.[1]
  const BUILD_DATE = src.match(/BUILD_DATE = '([^']+)'/)?.[1]
  const BUILD_LABEL = src.match(/BUILD_LABEL = `([^`]+)`/)?.[1]
  if (!BUILD_ID || !BUILD_DATE || !BUILD_LABEL) {
    throw new Error('Could not parse BUILD_ID, BUILD_DATE, or BUILD_LABEL from src/lib/buildInfo.ts')
  }
  return { BUILD_ID, BUILD_DATE, BUILD_LABEL }
}

function shortCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return '—'
  }
}

function updateFile(relPath, transform) {
  const abs = resolve(root, relPath)
  const before = readFileSync(abs, 'utf8')
  const after = transform(before)
  if (after !== before) {
    writeFileSync(abs, after, 'utf8')
    return true
  }
  return false
}

function syncReadme(build) {
  return updateFile('README.md', (text) => {
    let next = text.replace(
      /^\*\*BUILD [^*]+\*\* · Last updated: \d{4}-\d{2}-\d{2}/m,
      `**BUILD ${build.BUILD_ID}** · Last updated: ${build.BUILD_DATE}`,
    )
    next = next.replace(/^## Current state \(BUILD \d+\)/m, `## Current state (BUILD ${build.BUILD_ID.split('-').pop()})`)
    return next
  })
}

function syncSourceOfTruthAssets(build) {
  return updateFile('docs/SOURCE-OF-TRUTH.md', (text) =>
    text.replace(
      /\| React app \| `src\/` \+ `npm run dev` \| BUILD-\d+ — [^|]+\|/,
      `| React app | \`src/\` + \`npm run dev\` | BUILD-${build.BUILD_ID.split('-').pop()} — 15 routes, dark mode, BTC Map, ₿-first pricing |`,
    ),
  )
}

function syncUpdatesMapCurrent(build) {
  return updateFile('docs/UPDATES-MAP.md', (text) =>
    text.replace(
      /\| \*\*React app\*\* \| ✅ [\d.]+-\d+ \| [^|]+\|/,
      `| **React app** | ✅ ${build.BUILD_ID} | Vite + React 18 + TS + Tailwind · 15 routes · 16 flagships |`,
    ),
  )
}

function syncSourceOfTruth(build) {
  return updateFile('docs/SOURCE-OF-TRUTH.md', (text) =>
    text
      .replace(/^\*\*Date:\*\* \d{4}-\d{2}-\d{2}/m, `**Date:** ${build.BUILD_DATE}`)
      .replace(/^\*\*BUILD:\*\* [\d.]+-\d+/m, `**BUILD:** ${build.BUILD_ID}`),
  )
}

function syncUpdatesMap(build, commit) {
  return updateFile('docs/UPDATES-MAP.md', (text) => {
    let next = text.replace(
      /^\*\*BUILD:\*\* [\d.]+-\d+ · \*\*Last updated:\*\* \d{4}-\d{2}-\d{2}/m,
      `**BUILD:** ${build.BUILD_ID} · **Last updated:** ${build.BUILD_DATE}`,
    )
    const historyMarker = '## Build history'
    const historyIdx = next.indexOf(historyMarker)
    const historySection = historyIdx === -1 ? '' : next.slice(historyIdx)
    if (historySection && !historySection.includes(`| **${build.BUILD_ID}** |`)) {
      const row = `| **${build.BUILD_ID}** | ${build.BUILD_DATE} | \`${commit}\` | ${build.BUILD_LABEL} |`
      next = next.replace(
        /(\| BUILD \| Date \| Commit \| Summary \|\n\|[-| ]+\|\n)/,
        `$1${row}\n`,
      )
    }
    return next
  })
}

function syncChangelog(build) {
  const entry = `## [BUILD-${build.BUILD_ID}] — ${build.BUILD_DATE}

### Changed
- ${build.BUILD_LABEL}

---

`
  return updateFile('docs/CHANGELOG.md', (text) => {
    if (text.includes(`[BUILD-${build.BUILD_ID}]`)) return text
    const marker = '\n\n## [BUILD-'
    const idx = text.indexOf(marker)
    if (idx === -1) {
      return text.trimEnd() + '\n\n' + entry
    }
    return text.slice(0, idx) + '\n\n' + entry + text.slice(idx + 2)
  })
}

function syncFrontmatterBuild(relPath, build) {
  return updateFile(relPath, (text) =>
    text
      .replace(/^build: [\d.]+-\d+/m, `build: ${build.BUILD_ID}`)
      .replace(/^last_updated: \d{4}-\d{2}-\d{2}/m, `last_updated: ${build.BUILD_DATE}`),
  )
}

function syncDocsReadme(build) {
  return updateFile('docs/README.md', (text) =>
    text.replace(
      /^\*\*BUILD:\*\* [\d.]+-\d+ · \*\*Last updated:\*\* \d{4}-\d{2}-\d{2}/m,
      `**BUILD:** ${build.BUILD_ID} · **Last updated:** ${build.BUILD_DATE}`,
    ),
  )
}

function syncDiligence(build) {
  const dir = resolve(root, 'docs/diligence')
  const updated = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md')) continue
    const rel = join('docs/diligence', name)
    if (
      updateFile(rel, (text) =>
        text.replace(/^last_updated: \d{4}-\d{2}-\d{2}/m, `last_updated: ${build.BUILD_DATE}`),
      )
    ) {
      updated.push(rel)
    }
  }
  return updated
}

function syncPackageJson(build) {
  if (!build.BUILD_ID.includes('-28')) return false
  return updateFile('package.json', (text) => {
    const pkg = JSON.parse(text)
    if (pkg.version === '0.2.0') return text
    pkg.version = '0.2.0'
    return JSON.stringify(pkg, null, 2) + '\n'
  })
}

const build = readBuildInfo()
const commit = shortCommit()
const updated = []

if (syncReadme(build)) updated.push('README.md')
if (syncSourceOfTruth(build)) updated.push('docs/SOURCE-OF-TRUTH.md')
if (syncSourceOfTruthAssets(build)) updated.push('docs/SOURCE-OF-TRUTH.md (assets)')
if (syncUpdatesMap(build, commit)) updated.push('docs/UPDATES-MAP.md')
if (syncUpdatesMapCurrent(build)) updated.push('docs/UPDATES-MAP.md (current)')
if (syncChangelog(build)) updated.push('docs/CHANGELOG.md')
if (syncFrontmatterBuild('docs/MARKETING.md', build)) updated.push('docs/MARKETING.md')
if (syncFrontmatterBuild('docs/EXECUTIVE-SUMMARY.md', build)) updated.push('docs/EXECUTIVE-SUMMARY.md')
if (syncFrontmatterBuild('docs/MISSION.md', build)) updated.push('docs/MISSION.md')
if (syncFrontmatterBuild('docs/PITCH-ANCHOR.md', build)) updated.push('docs/PITCH-ANCHOR.md')
if (syncFrontmatterBuild('docs/SOVEREIGN-STACK-4-PILLARS.md', build)) updated.push('docs/SOVEREIGN-STACK-4-PILLARS.md')
if (syncDocsReadme(build)) updated.push('docs/README.md')
updated.push(...syncDiligence(build))
if (syncPackageJson(build)) updated.push('package.json')

console.log(`BUILD ${build.BUILD_ID} (${build.BUILD_DATE})`)
console.log(`Label: ${build.BUILD_LABEL}`)
if (updated.length) {
  console.log('Updated:')
  for (const f of updated) console.log(`  - ${f}`)
} else {
  console.log('No files changed (already in sync).')
}