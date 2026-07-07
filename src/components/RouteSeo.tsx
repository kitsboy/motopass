import { useLocation } from 'react-router-dom'
import { SeoHead } from './SeoHead'
import { ROUTE_SEO, resolveSeoForPath } from '../lib/seo'

function isKnownRoute(pathname: string): boolean {
  if (pathname in ROUTE_SEO) return true
  return /^\/blog\/[^/]+$/.test(pathname)
}

/** Renders per-route title + description from pathname (14 routes + blog slugs). */
export function RouteSeo() {
  const { pathname } = useLocation()
  if (!isKnownRoute(pathname)) return null

  const seo = resolveSeoForPath(pathname)
  const noIndex = seo.title === 'Post Not Found'

  return (
    <SeoHead
      title={seo.title}
      description={seo.description}
      path={seo.path}
      noIndex={noIndex}
    />
  )
}