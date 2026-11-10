#!/usr/bin/env node
/**
 * Record the currently deployed BUILD and live-health result in the top of the
 * Kimi handoff. Called by the live-health CI job after deploy-health passes.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseLiveIndex, saltToBuildId } from './lib/parse-live-index.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = (process.argv[2] ?? 'https://motopass.giveabit.io').replace(/\/$/, '')
const commit =
  process.env.GITHUB_SHA?.slice(0, 7) ??
  execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

let html
try {
  const response = await fetch(`${base}/`, {
    cache: 'no-store',
    headers: { Accept: 'text/html' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  html = await response.text()
} catch (error) {
  console.error(`FAIL: live index unavailable — ${error.message}`)
  process.exit(1)
}

const { buildSalt, mainBundlePath } = parseLiveIndex(html)
if (!buildSalt || !mainBundlePath) {
  console.error('FAIL: live index has no parseable BUILD salt or main bundle')
  process.exit(1)
}
const buildId = saltToBuildId(buildSalt) ?? buildSalt

let bundle
try {
  const response = await fetch(`${base}${mainBundlePath}`, {
    cache: 'no-store',
    headers: { Accept: '*/*' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  bundle = await response.text()
} catch (error) {
  console.error(`FAIL: live bundle unavailable — ${error.message}`)
  process.exit(1)
}
if (bundle.trimStart().startsWith('<')) {
  console.error('FAIL: live bundle returned HTML (cache poison)')
  process.exit(1)
}

const path = resolve(root, 'docs/KIMI-HANDOFF.md')
const handoff = readFileSync(path, 'utf8')
const markers = /<!-- live-deploy:start -->[\s\S]*?<!-- live-deploy:end -->/
if (!markers.test(handoff)) {
  console.error('FAIL: docs/KIMI-HANDOFF.md has no live-deploy markers')
  process.exit(1)
}

const line = `**Last live deploy:** BUILD \`${buildId}\` · commit \`${commit}\` · HTTP 200 · verified ${new Date().toISOString()}`
const next = handoff.replace(
  markers,
  `<!-- live-deploy:start -->\n${line}\n<!-- live-deploy:end -->`,
)
writeFileSync(path, next, 'utf8')
console.log(`Handoff updated: ${line}`)
