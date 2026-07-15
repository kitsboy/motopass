import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { SeoHead } from './SeoHead'
import { ROUTE_SEO, resolveSeoForPath } from '../lib/seo'
import { organizationJsonLd, websiteJsonLd, breadcrumbJsonLd } from '../lib/siteJsonLd'
import { useI18n } from '../i18n/I18nContext'

const BREADCRUMB_LABELS: Record<string, string> = {
  '/portfolio': 'Portfolio',
  '/programs': 'Programs',
  '/simulator': 'Stack Simulator',
  '/compare': 'Compare',
  '/btcmap': 'BTC Map',
  '/vault': 'Vault',
  '/agents': 'Agents',
  '/register': 'Register',
  '/dashboard': 'Dashboard',
}

function isKnownRoute(pathname: string): boolean {
  if (pathname in ROUTE_SEO) return true
  return /^\/blog\/[^/]+$/.test(pathname)
}

export function RouteSeo() {
  const { pathname } = useLocation()
  const { lang } = useI18n()

  const seo = useMemo(() => {
    if (!isKnownRoute(pathname)) return null
    return resolveSeoForPath(pathname, lang)
  }, [pathname, lang])

  const jsonLd = useMemo(() => {
    if (!seo) return null
    const crumbs = [{ name: 'Home', path: '/' }]
    if (pathname !== '/' && BREADCRUMB_LABELS[pathname]) {
      crumbs.push({ name: BREADCRUMB_LABELS[pathname], path: pathname })
    }
    const items = [organizationJsonLd(), websiteJsonLd()]
    if (crumbs.length > 1) items.push(breadcrumbJsonLd(crumbs))
    return items
  }, [seo, pathname])

  if (!seo) return null

  return (
    <SeoHead
      title={seo.title}
      description={seo.description}
      path={seo.path}
      noIndex={seo.title === 'Post Not Found'}
      jsonLd={jsonLd ?? undefined}
    />
  )
}