import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BLOG_POSTS } from '../data/blog'
import { TAXONOMY } from '../data/taxonomy'
import { TaxonomyChip } from '../components/TaxonomyChip'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'

export function BlogPage() {
  const { t, lang } = useI18n()
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  const posts = BLOG_POSTS
    .filter(p => p.langs.includes(lang))
    .filter(p => !activeLabel || p.labels.includes(activeLabel))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow="SEO · INSIGHTS" title={t('blog.title')} subtitle={t('blog.filter')} />

      <div className="flex flex-wrap gap-2 mb-8">
        <button type="button" onClick={() => setActiveLabel(null)} className={!activeLabel ? 'chip-active' : 'chip'}>
          All
        </button>
        {TAXONOMY.map(tx => (
          <TaxonomyChip key={tx.id} labelId={tx.id} active={activeLabel === tx.id} onClick={() => setActiveLabel(activeLabel === tx.id ? null : tx.id)} />
        ))}
      </div>

      <div className="grid gap-5">
        {posts.map(post => (
          <article key={post.id} className="card-elevated group">
            <div className="flex flex-wrap gap-2 mb-3">
              {post.labels.map(l => <TaxonomyChip key={l} labelId={l} />)}
            </div>
            <time className="text-[10px] font-mono text-ink-muted">{post.date}</time>
            <h2 className="text-lg sm:text-xl font-display font-semibold mt-1 mb-2 text-ink group-hover:text-btc-orange transition-colors">{post.title[lang]}</h2>
            <p className="text-sm text-ink-secondary mb-4 line-clamp-3 leading-relaxed">{post.excerpt[lang]}</p>
            <div className="flex flex-wrap gap-2 text-[10px] text-ink-muted mb-3">
              {post.seoKeywords.map(k => <span key={k} className="bg-section px-2 py-0.5 rounded-mp-sm border border-mp">#{k.replace(/\s+/g, '')}</span>)}
            </div>
            <Link to={`/blog/${post.slug}`} className="text-sm font-medium text-btc-orange hover:text-btc-orange-deep">{t('blog.read')} →</Link>
          </article>
        ))}
      </div>

      {posts.length === 0 && <div className="text-center py-16 card-muted text-ink-muted">No posts for this language/filter yet.</div>}
    </div>
  )
}