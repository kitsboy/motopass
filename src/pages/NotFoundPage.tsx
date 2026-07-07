import { Link } from 'react-router-dom'
import { SeoHead } from '../components/SeoHead'
import { PageHeader } from '../components/ui/PageHeader'
import { useI18n } from '../i18n/I18nContext'

const QUICK_LINK_KEYS = [
  { to: '/', key: 'nav.pitch' as const },
  { to: '/programs', key: 'nav.programs' as const },
  { to: '/blog', key: 'nav.blog' as const },
  { to: '/verify', key: 'nav.verify' as const },
  { to: '/register', key: 'nav.register' as const },
] as const

export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <SeoHead
        title={t('notFound.title')}
        description={t('notFound.body')}
        path="/404"
        noIndex
      />
      <PageHeader
        eyebrow={t('notFound.eyebrow')}
        title={t('notFound.title')}
        subtitle={t('notFound.subtitle')}
      />
      <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
        {t('notFound.body')}
      </p>
      <nav className="flex flex-wrap gap-3" aria-label="Helpful links">
        {QUICK_LINK_KEYS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-chip border border-mp-border px-3 py-2 text-sm font-medium text-mp-ink-secondary hover:border-mp-border-strong hover:text-accent transition-colors"
          >
            {t(link.key)}
          </Link>
        ))}
      </nav>
    </div>
  )
}