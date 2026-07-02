import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BLOG_POSTS } from '../data/blog'
import { TAXONOMY } from '../data/taxonomy'
import { TaxonomyChip } from '../components/TaxonomyChip'
import { useI18n } from '../i18n/I18nContext'

export function BlogPage() {
  const { t, lang } = useI18n()
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  const posts = BLOG_POSTS
    .filter(p => p.langs.includes(lang))
    .filter(p => !activeLabel || p.labels.includes(activeLabel))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="section-label mb-1">SEO • INSIGHTS</div>
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-2">{t('blog.title')}</h1>
      <p className="text-sm text-sovereign-silver mb-6">{t('blog.filter')}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setActiveLabel(null)}
          className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border ${!activeLabel ? 'border-btc-orange text-btc-orange bg-btc-orange/10' : 'border-white/15 text-sovereign-silver'}`}
        >
          All
        </button>
        {TAXONOMY.map(tx => (
          <TaxonomyChip
            key={tx.id}
            labelId={tx.id}
            active={activeLabel === tx.id}
            onClick={() => setActiveLabel(activeLabel === tx.id ? null : tx.id)}
          />
        ))}
      </div>

      <div className="grid gap-4">
        {posts.map(post => (
          <article key={post.id} className="card hover:border-btc-orange/40">
            <div className="flex flex-wrap gap-2 mb-3">
              {post.labels.map(l => <TaxonomyChip key={l} labelId={l} />)}
            </div>
            <time className="text-[10px] font-mono text-sovereign-silver">{post.date}</time>
            <h2 className="text-lg sm:text-xl font-semibold mt-1 mb-2">{post.title[lang]}</h2>
            <p className="text-sm text-sovereign-silver mb-4 line-clamp-3">{post.excerpt[lang]}</p>
            <div className="flex flex-wrap gap-2 text-[10px] text-sovereign-silver/70 mb-3">
              {post.seoKeywords.map(k => <span key={k} className="bg-white/5 px-2 py-0.5 rounded">#{k.replace(/\s+/g, '')}</span>)}
            </div>
            <Link to={`/blog/${post.slug}`} className="text-sm text-btc-orange hover:underline">{t('blog.read')} →</Link>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-sovereign-silver text-center py-12">No posts for this language/filter yet.</p>
      )}
    </div>
  )
}