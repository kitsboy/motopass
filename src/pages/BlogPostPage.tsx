import { Link, useParams } from 'react-router-dom'
import { BLOG_POSTS } from '../data/blog'
import { TaxonomyChip } from '../components/TaxonomyChip'
import { useI18n } from '../i18n/I18nContext'

export function BlogPostPage() {
  const { slug } = useParams()
  const { lang } = useI18n()
  const post = BLOG_POSTS.find(p => p.slug === slug)

  if (!post) {
    return (
      <div className="px-4 py-20 text-center">
        <div className="card-muted max-w-sm mx-auto py-10">
          <p className="text-ink-secondary mb-4">Post not found.</p>
          <Link to="/blog" className="text-btc-orange font-medium hover:underline">← Back</Link>
        </div>
      </div>
    )
  }

  return (
    <article className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <Link to="/blog" className="text-sm text-ink-muted hover:text-btc-orange mb-6 inline-block font-medium">← Insights</Link>
      <div className="flex flex-wrap gap-2 mb-4">
        {post.labels.map(l => <TaxonomyChip key={l} labelId={l} />)}
      </div>
      <time className="text-xs font-mono text-ink-muted">{post.date}</time>
      <h1 className="text-2xl sm:text-4xl font-display font-semibold mt-2 mb-4 text-ink leading-tight">{post.title[lang]}</h1>
      <p className="text-base sm:text-lg text-ink-secondary leading-relaxed mb-8">{post.excerpt[lang]}</p>

      <div className="card text-sm text-ink-secondary space-y-4 leading-relaxed">
        <p>
          This article is part of MotoPass&apos;s multilingual sovereign mobility knowledge base.
          All material claims in production are stamped via <a href="https://satohash.io" className="text-btc-orange font-medium hover:underline" target="_blank" rel="noopener noreferrer">Satohash.io</a> OpenTimestamps proofs.
        </p>
        <p>
          Connect your Nostr identity to receive jurisdiction-specific updates for: {post.labels.join(', ')}.
          Country liaison agents are available for verified applicants exploring {post.seoKeywords.slice(0, 2).join(' and ')}.
        </p>
        <p className="text-xs font-mono text-btc-orange/90 bg-btc-orange-soft px-3 py-2 rounded-mp-md">
          SEO: {post.seoKeywords.join(' · ')}
        </p>
      </div>
    </article>
  )
}