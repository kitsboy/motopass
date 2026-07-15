#!/usr/bin/env node
/**
 * Lighthouse accessibility budget — warn-only (exit 0).
 * Runs against local preview after `npm run build`.
 *
 * Env:
 *   A11Y_MIN_SCORE — minimum accessibility score (default 90)
 *   A11Y_PREVIEW_PORT — preview port (default 4173)
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '../dist')
const PORT = Number(process.env.A11Y_PREVIEW_PORT || 4173)
const MIN_SCORE = Number(process.env.A11Y_MIN_SCORE || 90)
const BASE = `http://127.0.0.1:${PORT}/`

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
}

function startStaticServer() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer((req, res) => {
      const urlPath = (req.url ?? '/').split('?')[0]
      const rel = urlPath === '/' ? '/index.html' : urlPath
      const filePath = resolve(DIST, `.${rel}`)
      if (!filePath.startsWith(DIST) || !existsSync(filePath)) {
        const fallback = resolve(DIST, 'index.html')
        if (existsSync(fallback)) {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(readFileSync(fallback))
          return
        }
        res.writeHead(404)
        res.end('Not found')
        return
      }
      const ext = extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
      res.end(readFileSync(filePath))
    })
    server.on('error', reject)
    server.listen(PORT, '127.0.0.1', () => resolvePromise(server))
  })
}

function runLighthouse() {
  return new Promise((resolvePromise, reject) => {
    const args = [
      BASE,
      '--only-categories=accessibility',
      '--output=json',
      '--output-path=stdout',
      '--quiet',
      '--chrome-flags=--headless --no-sandbox --disable-gpu',
    ]
    const child = spawn('npx', ['--yes', 'lighthouse', ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `lighthouse exited ${code}`))
        return
      }
      try {
        resolvePromise(JSON.parse(stdout))
      } catch (err) {
        reject(new Error(`Could not parse Lighthouse JSON: ${err.message}`))
      }
    })
  })
}

if (!existsSync(resolve(DIST, 'index.html'))) {
  console.warn('WARN: dist/index.html missing — run npm run build first')
  process.exit(0)
}

let server
try {
  server = await startStaticServer()
  const report = await runLighthouse()
  const score = Math.round((report.categories?.accessibility?.score ?? 0) * 100)
  if (score < MIN_SCORE) {
    console.warn(`WARN: Lighthouse accessibility ${score} is below budget ${MIN_SCORE}`)
  } else {
    console.log(`A11Y OK: Lighthouse accessibility ${score} (budget ${MIN_SCORE})`)
  }
} catch (err) {
  console.warn(`WARN: Lighthouse a11y check skipped — ${err.message}`)
} finally {
  server?.close()
}

process.exit(0)