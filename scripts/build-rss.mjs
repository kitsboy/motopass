#!/usr/bin/env node
/**
 * Write public/feed.xml from the English titles already in src/data/blog.ts.
 * Does not translate. Does not invent posts.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://motopass.giveabit.io'
const src = readFileSync(join(ROOT, 'src', 'data', 'blog.ts'), 'utf8')

const posts = []
const blocks = src.split(/\n  \{\n/).slice(1)
for (const block of blocks) {
  const slug = block.match(/slug: '([^']+)'/)?.[1]
  const date = block.match(/date: '([^']+)'/)?.[1]
  const title = block.match(/title: \{\s*en: '([^']+)'/)?.[1]
  const excerpt = block.match(/excerpt: \{\s*en: '([^']+)'/)?.[1]
  if (slug && date && title && excerpt) posts.push({ slug, date, title, excerpt })
}
if (posts.length < 1) {
  console.error('no blog posts parsed')
  process.exit(1)
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;')
}

const items = posts.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
    </item>`).join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>MotoPass — Truth You Can Verify</title>
    <link>${SITE}/blog</link>
    <description>Residency and passport notes from MotoPass. Own posts only. Sibling news is not mixed in.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`
writeFileSync(join(ROOT, 'public', 'feed.xml'), xml)
console.log(`feed.xml ${posts.length} items`)
