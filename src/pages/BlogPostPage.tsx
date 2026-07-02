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
      <div className="px-4 py-16 text-center">
        <p className="text-sovereign-silver mb-4">Post not found.</p>
        <Link to="/blog" className="text-btc-orange hover:underline">← Back</Link>
      </div>
    )
  }

  return (
    <article className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <Link to="/blog" className="text-sm text-sovereign-silver hover:text-btc-orange mb-6 inline-block">← Insights</Link>
      <div className="flex flex-wrap gap-2 mb-4">
        {post.labels.map(l => <TaxonomyChip key={l} labelId={l} />)}
      </div>
      <time className="text-xs font-mono text-sovereign-silver">{post.date}</time>
      <h1 className="text-2xl sm:text-4xl font-display font-semibold mt-2 mb-4">{post.title[lang]}</h1>
      <p className="text-base sm:text-lg text-sovereign-silver leading-relaxed mb-8">{post.excerpt[lang]}</p>

      <div className="card text-sm text-sovereign-silver space-y-4 leading-relaxed">
        <p>
          This article is part of MotoPass&apos;s multilingual sovereign mobility knowledge base.
          All material claims in production are stamped via <a href="https://satohash.io" className="text-btc-orange hover:underline" target="_blank" rel="noopener noreferrer">Satohash.io</a> OpenTimestamps proofs.
        </p>
        <p>
          Connect your Nostr identity to receive jurisdiction-specific updates for: {post.labels.join(', ')}.
          Country liaison agents are available for verified applicants exploring {post.seoKeywords.slice(0, 2).join(' and ')}.
        </p>
        <p className="text-xs font-mono text-btc-orange/80">
          SEO: {post.seoKeywords.join(' • ')}
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link to="/apply" className="btn-primary text-center">Register interest</Link>
        <Link to="/verify" className="btn-secondary text-center">Verify on Bitcoin</Link>
      </div>
    </article>
  )
}