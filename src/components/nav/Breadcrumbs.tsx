import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/translations'

const ROUTE_LABELS: Record<string, TranslationKey> = {
  portfolio: 'nav.portfolio',
  btcmap: 'nav.btcmap',
  programs: 'nav.programs',
  simulator: 'nav.simulator',
  compare: 'nav.compare',
  vault: 'nav.vault',
  blog: 'nav.blog',
  verify: 'nav.verify',
  agents: 'nav.agents',
  apply: 'nav.apply',
  register: 'nav.register',
  dashboard: 'nav.dashboard',
  profile: 'nav.profile',
}

const HIDE_ON = new Set(['/', ''])

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const { t } = useI18n()

  if (HIDE_ON.has(pathname)) return null

  const segments = pathname.split('/').filter(Boolean)
  if (!segments.length) return null

  return (
    <nav aria-label={t('nav.breadcrumbs')} className="text-xs text-ink-muted mb-2">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-accent transition-colors">
            {t('nav.pitch')}
          </Link>
        </li>
        {segments.map((seg, i) => {
          const path = `/${segments.slice(0, i + 1).join('/')}`
          const isLast = i === segments.length - 1
          const labelKey = ROUTE_LABELS[seg]
          const label = labelKey ? t(labelKey) : seg.replace(/-/g, ' ')
          return (
            <li key={path} className="flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              {isLast ? (
                <span aria-current="page" className="text-ink font-medium capitalize">
                  {label}
                </span>
              ) : (
                <Link to={path} className="hover:text-accent transition-colors capitalize">
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}