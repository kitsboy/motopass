#!/usr/bin/env node
/**
 * Route smoke test.
 *
 * The Pages middleware (functions/_middleware.js) answers 404 for any path that
 * is not in its allowlist, so a real page can disappear the moment it is added
 * to the app and the sitemap but not to that list. This gate reads the sitemap
 * (the routes we publish) and asks the middleware itself whether each one is
 * known — and asks it to reject a junk path.
 *
 * Live mode: `node scripts/check-routes.mjs --live https://host` fetches every
 * sitemap route and expects a 200 with a non-empty body, plus a 404 for a junk
 * path.
 */
import { readFileSync } from 'node:fs'

const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(m => new URL(m[1]).pathname)
  .filter(p => !/\.[a-z0-9]+$/i.test(p))

const mod = await import(new URL('../functions/_middleware.js', import.meta.url).href)

// The middleware only exposes onRequest; drive it with a stub context.
function allows(pathname) {
  let next = false
  const context = {
    request: new Request('https://example.test' + pathname),
    next: () => { next = true; return new Response('spa shell', { status: 200 }) },
  }
  return mod.onRequest(context).then(res => ({ status: res.status, passedThrough: next }))
}

const live = process.argv.includes('--live') ? process.argv[process.argv.indexOf('--live') + 1] : null

let failures = 0
if (live) {
  for (const path of [...routes, '/definitely-not-a-route-xyz']) {
    const expect = path.startsWith('/definitely') ? 404 : 200
    const res = await fetch(live.replace(/\/$/, '') + path, { redirect: 'manual' })
    const body = await res.text()
    const ok = res.status === expect && (expect === 404 || body.length > 200)
    if (!ok) failures++
    console.log(`${ok ? '✓' : '✗'} ${res.status} (want ${expect}) ${path} · ${body.length} bytes`)
  }
} else {
  for (const path of routes) {
    const { status, passedThrough } = await allows(path)
    const ok = status === 200 && passedThrough
    if (!ok) failures++
    console.log(`${ok ? '✓' : '✗'} ${status}${passedThrough ? ' shell' : ' 404'} ${path}`)
  }
  const junk = await allows('/definitely-not-a-route-xyz')
  const junkOk = junk.status === 404 && !junk.passedThrough
  if (!junkOk) failures++
  console.log(`${junkOk ? '✓' : '✗'} ${junk.status} (want 404) /definitely-not-a-route-xyz`)
}

console.log(failures ? `\n${failures} route(s) failed` : `\nall ${routes.length} routes answered as expected`)
process.exit(failures ? 1 : 0)
