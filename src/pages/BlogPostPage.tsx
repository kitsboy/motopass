import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BLOG_POSTS } from '../data/blog'
import { TaxonomyChip } from '../components/TaxonomyChip'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'
import { SeoHead } from '../components/SeoHead'
import { SITE_NAME, SITE_URL, absoluteUrl } from '../lib/seo'
import { estimateReadingMinutes } from '../lib/utils'

export function BlogPostPage() {
  const { slug } = useParams()
  const { lang } = useI18n()
  const post = BLOG_POSTS.find(p => p.slug === slug)

  const readingMinutes = useMemo(() => {
    if (!post) return 0
    const bodyCopy = [
      'This article is part of MotoPass sovereign mobility knowledge base.',
      'Connect your Nostr identity to receive jurisdiction-specific updates.',
      post.seoKeywords.join(' '),
    ].join(' ')
    return estimateReadingMinutes(post.title[lang], post.excerpt[lang], bodyCopy)
  }, [post, lang])

  const articleJsonLd = useMemo(() => {
    if (!post) return undefined
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title.en,
      description: post.excerpt.en,
      datePublished: post.date,
      dateModified: post.date,
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      url: absoluteUrl(`/blog/${post.slug}`),
      keywords: post.seoKeywords.join(', '),
      inLanguage: post.langs,
    }
  }, [post])

  if (!post) {
    return (
      <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
        <PageHeader title="Post not found" eyebrow="INSIGHTS" />
        <div className="text-center">
          <Link to="/blog" className="text-accent font-medium hover:underline">← Back to Insights</Link>
        </div>
      </div>
    )
  }

  return (
    <article className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <SeoHead
        title={post.title[lang]}
        description={post.excerpt[lang]}
        path={`/blog/${post.slug}`}
        jsonLd={articleJsonLd}
      />
      <Link to="/blog" className="text-sm text-ink-secondary hover:text-accent mb-6 inline-block font-medium">← Insights</Link>
      <PageHeader
        eyebrow={post.date}
        title={post.title[lang]}
        subtitle={post.excerpt[lang]}
      />
      <p className="mb-6 text-xs font-mono text-ink-muted" aria-label={`${readingMinutes} minute read`}>
        {readingMinutes} min read
      </p>
      <div className="flex flex-wrap gap-2 mb-8">
        {post.labels.map(l => <TaxonomyChip key={l} labelId={l} />)}
      </div>

      <div className="card text-sm text-ink-secondary space-y-4 leading-relaxed">
        <p>
          This article is part of MotoPass&apos;s multilingual sovereign mobility knowledge base.
          All material claims in production are stamped via <a href="https://satohash.io" className="text-accent font-medium hover:underline" target="_blank" rel="noopener noreferrer">Satohash.io</a> OpenTimestamps proofs.
        </p>
        <p>
          Connect your Nostr identity to receive jurisdiction-specific updates for: {post.labels.join(', ')}.
          Country liaison agents are available for verified applicants exploring {post.seoKeywords.slice(0, 2).join(' and ')}.
        </p>
        <p className="text-xs font-mono text-mp-btc-text bg-btc-orange-soft px-3 py-2 rounded-mp-md">
          SEO: {post.seoKeywords.join(' · ')}
        </p>
      </div>
    </article>
  )
}