#!/usr/bin/env node
/**
 * Emit deploy summary JSON with local + live BUILD and health probes.
 * Usage: node scripts/deploy-summary.mjs [baseUrl] [--out path.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseLiveIndex, saltToBuildId } from './lib/parse-live-index.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const args = process.argv.slice(2)
const outIdx = args.indexOf('--out')
const outPath = outIdx === -1 ? null : args[outIdx + 1]
const base = (args.find(a => !a.startsWith('--') && a !== outPath) ?? 'https://motopass.giveabit.io').replace(
  /\/$/,
  '',
)

function readLocalBuildId() {
  const info = readFileSync(resolve(root, 'src/lib/buildInfo.ts'), 'utf8')
  return info.match(/BUILD_ID\s*=\s*'([^']+)'/)?.[1] ?? null
}

function cacheDirectiveOk(value) {
  return /no-store/i.test(value ?? '')
}

const summary = {
  generatedAt: new Date().toISOString(),
  site: base,
  localBuildId: readLocalBuildId(),
  liveBuildId: null,
  buildMatch: null,
  bundleOk: null,
  headersOk: null,
  health: 'unknown',
  errors: [],
}

try {
  const res = await fetch(`${base}/`, { cache: 'no-store', headers: { Accept: 'text/html' } })
  const cacheControl = res.headers.get('cache-control') ?? ''
  const cdnCacheControl = res.headers.get('cdn-cache-control') ?? ''
  summary.headersOk = res.ok && cacheDirectiveOk(cacheControl) && (!cdnCacheControl || cacheDirectiveOk(cdnCacheControl))
  if (!summary.headersOk) {
    summary.errors.push(
      `index.html headers: Cache-Control="${cacheControl}" CDN-Cache-Control="${cdnCacheControl || '(empty)'}"`,
    )
  }

  if (!res.ok) {
    summary.errors.push(`GET ${base}/ returned HTTP ${res.status}`)
    summary.health = 'fail'
  } else {
    const html = await res.text()
    const { buildSalt, mainBundlePath } = parseLiveIndex(html)
    summary.liveBuildId = buildSalt ? (saltToBuildId(buildSalt) ?? buildSalt) : null
    summary.buildMatch = summary.localBuildId != null && summary.liveBuildId === summary.localBuildId

    if (!mainBundlePath) {
      summary.errors.push('could not parse main bundle from live index.html')
      summary.bundleOk = false
    } else {
      const jsUrl = `${base}${mainBundlePath}`
      const bundleRes = await fetch(jsUrl, { cache: 'no-store', headers: { Accept: '*/*' } })
      const body = await bundleRes.text()
      summary.bundleOk = bundleRes.ok && !body.trimStart().startsWith('<')
      if (!summary.bundleOk) summary.errors.push(`${jsUrl} HTTP ${bundleRes.status} or HTML body`)
    }

    summary.health =
      summary.buildMatch && summary.bundleOk && summary.headersOk
        ? 'ok'
        : summary.bundleOk && summary.headersOk
          ? 'warn'
          : 'fail'
  }
} catch (err) {
  summary.errors.push(err.message)
  summary.health = 'fail'
}

const json = JSON.stringify(summary, null, 2)
if (outPath) {
  mkdirSync(dirname(resolve(outPath)), { recursive: true })
  writeFileSync(outPath, json + '\n', 'utf8')
  console.log(`Wrote ${outPath}`)
} else {
  console.log(json)
}

if (summary.health === 'fail') process.exit(1)