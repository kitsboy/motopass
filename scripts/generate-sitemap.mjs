#!/usr/bin/env node
/** Regenerate public/sitemap.xml from route list + blog slugs. */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITE = process.env.VITE_SITE_URL || 'https://motopass.giveabit.io'

function readBuildDate() {
  try {
    const info = readFileSync(resolve(__dirname, '../src/lib/buildInfo.ts'), 'utf8')
    const match = info.match(/BUILD_DATE\s*=\s*'([^']+)'/)
    if (match) return match[1]
  } catch {
    /* fall through */
  }
  return new Date().toISOString().slice(0, 10)
}

const LASTMOD = readBuildDate()

/**
 * Public, shipped surfaces only.
 *
 * Removed on purpose: /portfolio (empty), /agents (not live), /blog (one post),
 * /distressed (parked — it is a different, riskier product). They stay mounted
 * as routes so old links resolve, but they are not advertised to crawlers.
 * /proof is the merged trust + sources + vault + tools hub.
 */
const ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/programs', priority: '0.9', changefreq: 'weekly' },
  { path: '/compare', priority: '0.9', changefreq: 'weekly' },
  { path: '/simulator', priority: '0.8', changefreq: 'weekly' },
  { path: '/proof', priority: '0.85', changefreq: 'daily' },
  { path: '/trust', priority: '0.75', changefreq: 'daily' },
  { path: '/vault', priority: '0.7', changefreq: 'weekly' },
  { path: '/sources', priority: '0.7', changefreq: 'daily' },
  { path: '/tools', priority: '0.7', changefreq: 'monthly' },
  { path: '/tools/receipt', priority: '0.5', changefreq: 'monthly' },
  { path: '/btcmap', priority: '0.7', changefreq: 'weekly' },
  { path: '/verify', priority: '0.7', changefreq: 'monthly' },
  { path: '/apply', priority: '0.8', changefreq: 'weekly' },
  { path: '/register', priority: '0.6', changefreq: 'weekly' },
  { path: '/dashboard', priority: '0.6', changefreq: 'daily' },
  { path: '/profile', priority: '0.5', changefreq: 'weekly' },
]

const urls = [
  ...ROUTES.map((r) => ({ loc: `${SITE}${r.path === '/' ? '/' : r.path}`, ...r })),
  { loc: `${SITE}/website/index.html`, priority: '0.7', changefreq: 'weekly' },
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${LASTMOD}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`

const out = resolve(__dirname, '../public/sitemap.xml')
writeFileSync(out, xml)
console.log(`Wrote ${urls.length} URLs to public/sitemap.xml`)
