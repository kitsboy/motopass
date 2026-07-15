import { Link, useLocation } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import type { TranslationKey } from '../../i18n/translations'

const MAX_VISIBLE_SEGMENTS = 3

const ROUTE_LABELS: Record<string, TranslationKey> = {
  portfolio: 'nav.portfolio',
  btcmap: 'nav.btcmap',
  programs: 'nav.programs',
  simulator: 'nav.simulator',
  compare: 'nav.compare',
  vault: 'nav.vault',
  distressed: 'nav.distressed',
  blog: 'nav.blog',
  verify: 'nav.verify',
  agents: 'nav.agents',
  apply: 'nav.apply',
  register: 'nav.register',
  dashboard: 'nav.dashboard',
  profile: 'nav.profile',
}

const HIDE_ON = new Set(['/', ''])

function segmentLabel(seg: string, t: (key: TranslationKey) => string): string {
  const labelKey = ROUTE_LABELS[seg]
  return labelKey ? t(labelKey) : seg.replace(/-/g, ' ')
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const { t } = useI18n()

  if (HIDE_ON.has(pathname)) return null

  const segments = pathname.split('/').filter(Boolean)
  if (!segments.length) return null

  const collapsed = segments.length > MAX_VISIBLE_SEGMENTS
  const visibleSegments = collapsed
    ? [segments[0], ...segments.slice(-2)]
    : segments
  const showHomeIcon = segments.length > 1

  return (
    <nav aria-label={t('nav.breadcrumbs')} className="breadcrumb-glass text-xs text-ink-muted mb-3 w-fit max-w-full">
      <ol className="flex flex-wrap items-center gap-0.5 sm:gap-1.5 min-w-0">
        <li>
          <Link to="/" className="breadcrumb-link hover:text-accent transition-colors inline-flex items-center gap-1">
            {showHomeIcon ? (
              <>
                <Home size={13} strokeWidth={2.25} aria-hidden="true" className="shrink-0" />
                <span className="sr-only">{t('nav.pitch')}</span>
              </>
            ) : (
              t('nav.pitch')
            )}
          </Link>
        </li>
        {visibleSegments.map((seg, i) => {
          const realIndex = collapsed
            ? (i === 0 ? 0 : segments.length - (visibleSegments.length - i))
            : i
          const path = `/${segments.slice(0, realIndex + 1).join('/')}`
          const isLast = realIndex === segments.length - 1
          const label = segmentLabel(seg, t)

          return (
            <li key={`${path}-${realIndex}`} className="flex items-center gap-0.5 sm:gap-1.5">
              {collapsed && i === 1 && (
                <>
                  <span className="breadcrumb-sep px-0.5 sm:px-0" aria-hidden="true">/</span>
                  <span className="breadcrumb-ellipsis px-1" title={t('nav.breadcrumbsEllipsis')} aria-hidden="true">
                    …
                  </span>
                </>
              )}
              <span className="breadcrumb-sep px-0.5 sm:px-0" aria-hidden="true">/</span>
              {isLast ? (
                <span aria-current="page" className="breadcrumb-current text-ink font-medium capitalize">
                  {label}
                </span>
              ) : (
                <Link to={path} className="breadcrumb-link hover:text-accent transition-colors capitalize">
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