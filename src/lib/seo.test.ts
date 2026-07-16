import { describe, expect, it } from 'vitest'
import { BLOG_POSTS } from '../data/blog'
import { ROUTE_SEO, ROUTE_SEO_I18N, resolveSeoForPath } from './seo'

describe('resolveSeoForPath', () => {
  it('returns meta for every static route', () => {
    for (const path of Object.keys(ROUTE_SEO)) {
      const seo = resolveSeoForPath(path, 'en')
      expect(seo.path).toBe(path)
      expect(seo.title.length).toBeGreaterThan(4)
      expect(seo.description.length).toBeGreaterThan(20)
    }
  })

  it('applies German programs page override', () => {
    const seo = resolveSeoForPath('/programs', 'de')
    expect(seo.title).toContain('Bitcoin-Visa')
    expect(seo.description).toContain('Satohash')
  })

  it('resolves blog slug descriptions from post excerpt', () => {
    for (const post of BLOG_POSTS) {
      const seo = resolveSeoForPath(`/blog/${post.slug}`, 'en')
      expect(seo.description).toBe(post.excerpt.en)
      expect(seo.title).toBe(post.title.en)
    }
  })

  it('keeps i18n overrides aligned with ROUTE_SEO keys', () => {
    for (const [lang, routes] of Object.entries(ROUTE_SEO_I18N)) {
      for (const path of Object.keys(routes ?? {})) {
        expect(ROUTE_SEO[path], `${lang} override for unknown path ${path}`).toBeDefined()
      }
    }
  })
})

describe('websiteJsonLd SearchAction', () => {
  it('uses EntryPoint urlTemplate for programs search', async () => {
    const { websiteJsonLd } = await import('./siteJsonLd')
    const json = websiteJsonLd()
    expect(json.potentialAction).toMatchObject({
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: expect.stringContaining('/programs?q={search_term_string}'),
      },
    })
  })
})