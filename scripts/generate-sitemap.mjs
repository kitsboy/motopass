#!/usr/bin/env node
/** Regenerate public/sitemap.xml from route list + blog slugs. */
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITE = process.env.VITE_SITE_URL || 'https://motopass.giveabit.io'
const TODAY = new Date().toISOString().slice(0, 10)

const ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/portfolio', priority: '0.9', changefreq: 'weekly' },
  { path: '/programs', priority: '0.9', changefreq: 'weekly' },
  { path: '/btcmap', priority: '0.85', changefreq: 'weekly' },
  { path: '/simulator', priority: '0.8', changefreq: 'weekly' },
  { path: '/compare', priority: '0.8', changefreq: 'weekly' },
  { path: '/vault', priority: '0.8', changefreq: 'weekly' },
  { path: '/blog', priority: '0.9', changefreq: 'daily' },
  { path: '/verify', priority: '0.8', changefreq: 'monthly' },
  { path: '/agents', priority: '0.8', changefreq: 'weekly' },
  { path: '/apply', priority: '0.8', changefreq: 'weekly' },
  { path: '/register', priority: '0.9', changefreq: 'weekly' },
  { path: '/dashboard', priority: '0.8', changefreq: 'daily' },
  { path: '/profile', priority: '0.7', changefreq: 'weekly' },
]

const BLOG_SLUGS = [
  'truth-you-can-verify-launch',
  'nostr-passport-applications',
  'el-salvador-bitcoin-legal-tender',
  'country-liaison-agents',
]

const urls = [
  ...ROUTES.map((r) => ({ loc: `${SITE}${r.path === '/' ? '/' : r.path}`, ...r })),
  ...BLOG_SLUGS.map((slug) => ({
    loc: `${SITE}/blog/${slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  })),
  { loc: `${SITE}/website/index.html`, priority: '0.7', changefreq: 'weekly' },
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${TODAY}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`

const out = resolve(__dirname, '../public/sitemap.xml')
writeFileSync(out, xml)
console.log(`Wrote ${urls.length} URLs to public/sitemap.xml`)