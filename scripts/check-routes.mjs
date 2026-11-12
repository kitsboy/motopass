#!/usr/bin/env node
/**
 * Route smoke test — three sources must agree.
 *
 *   1. the router (src/App.tsx `path="..."`)
 *   2. the Pages middleware allowlist (functions/_middleware.js ROUTE_PATHS)
 *   3. the sitemap (the routes we publish)
 *
 * If a page exists in the router but not the middleware, it 404s for anyone
 * arriving from a link — that is how /proof was dead. This gate fails on any
 * difference in either direction, so the lists cannot drift again.
 *
 * Live mode: `node scripts/check-routes.mjs --live https://host` also fetches
 * every sitemap route and expects a 200 with a non-empty body, plus a 404 for
 * a junk path.
 */
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

const sitemapRoutes = [...read('../public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(m => new URL(m[1]).pathname)
  .filter(p => !/\.[a-z0-9]+$/i.test(p))

// The router's own 404 page is `path="*"`; it is not a page to publish.
const routerRoutes = [...read('../src/App.tsx').matchAll(/path="([^"]+)"/g)]
  .map(m => m[1])
  .filter(p => p !== '*')
  .map(p => '/' + p.replace(/^\//, ''))
// `<Route index ...>` is the home page: it has no path attribute.
if (/<Route\s+index/.test(read('../src/App.tsx'))) routerRoutes.push('/')

const mod = await import(new URL('../functions/_middleware.js', import.meta.url).href)
const middlewareRoutes = mod.ROUTE_PATHS

const norm = (p) => (p === '/' ? '/' : p.replace(/\/$/, ''))
const set = (arr) => new Set(arr.map(norm))
const router = set(routerRoutes)
const middleware = set(middlewareRoutes)
const sitemap = set(sitemapRoutes)

let failures = 0

// A router route the middleware refuses: it 404s for a direct visit.
const missingInMiddleware = [...router].filter(p => !middleware.has(p))
// A middleware route with no page behind it: the shell loads, the router 404s.
const staleInMiddleware = [...middleware].filter(p => !router.has(p))
// A published route the middleware would block.
const blockedSitemap = [...sitemap].filter(p => !middleware.has(p))
// Router routes nobody publishes (informational only).
const unpublished = [...router].filter(p => !sitemap.has(p))

if (missingInMiddleware.length) {
  failures++
  console.error('✗ router route missing from the middleware allowlist:', missingInMiddleware.join(', '))
}
if (staleInMiddleware.length) {
  failures++
  console.error('✗ middleware allows a path the router does not serve:', staleInMiddleware.join(', '))
}
if (blockedSitemap.length) {
  failures++
  console.error('✗ sitemap route the middleware would 404:', blockedSitemap.join(', '))
}
if (unpublished.length) console.log('· not in sitemap (fine):', unpublished.join(', '))

if (!failures) console.log(`✓ router ${router.size} · middleware ${middleware.size} · sitemap ${sitemap.size} agree`)

// Drive the middleware directly: each sitemap route must pass through to the
// shell, and a junk path must be refused by the middleware itself.
async function allows(pathname) {
  let next = false
  const res = await mod.onRequest({
    request: new Request('https://example.test' + pathname),
    next: () => { next = true; return new Response('spa shell', { status: 200 }) },
  })
  return { status: res.status, passedThrough: next }
}

for (const path of sitemapRoutes) {
  const { status, passedThrough } = await allows(path)
  if (status !== 200 || !passedThrough) {
    failures++
    console.error(`✗ middleware answers ${status} for ${path}`)
  }
}
const junk = await allows('/definitely-not-a-route-xyz')
if (junk.status !== 404 || junk.passedThrough) {
  failures++
  console.error(`✗ middleware answers ${junk.status} for a junk path (want 404)`)
}

const live = process.argv.includes('--live') ? process.argv[process.argv.indexOf('--live') + 1] : null
if (live) {
  for (const path of [...sitemapRoutes, '/definitely-not-a-route-xyz']) {
    const expect = path.startsWith('/definitely') ? 404 : 200
    const res = await fetch(live.replace(/\/$/, '') + path, { redirect: 'manual' })
    const body = await res.text()
    const ok = res.status === expect && (expect === 404 || body.length > 200)
    if (!ok) failures++
    console.log(`${ok ? '✓' : '✗'} ${res.status} (want ${expect}) ${path} · ${body.length} bytes`)
  }
}

console.log(failures ? `\n${failures} route check(s) failed` : '\nroutes agree')
process.exit(failures ? 1 : 0)
