import { NavLink, useMatch, useResolvedPath, type NavLinkProps } from 'react-router-dom'
import { prefetchRoute } from '../../lib/prefetchRoutes'

const PREFETCH_DEBOUNCE_MS = 120
const prefetchTimers = new Map<string, ReturnType<typeof setTimeout>>()

function routePath(to: NavLinkProps['to']): string {
  if (typeof to === 'string') return to
  return to.pathname ?? ''
}

function warmRoute(path: string) {
  const existing = prefetchTimers.get(path)
  if (existing) clearTimeout(existing)
  prefetchTimers.set(
    path,
    setTimeout(() => {
      prefetchTimers.delete(path)
      prefetchRoute(path)
    }, PREFETCH_DEBOUNCE_MS),
  )
}

export function PrefetchNavLink({ onMouseEnter, onFocus, onPointerEnter, to, end, ...props }: NavLinkProps) {
  const path = routePath(to)
  const resolved = useResolvedPath(typeof to === 'string' ? to : to.pathname ?? '')
  const match = useMatch({ path: resolved.pathname, end: end ?? resolved.pathname === '/' })

  return (
    <NavLink
      {...props}
      to={to}
      end={end}
      aria-current={match ? 'page' : undefined}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') warmRoute(path)
        onPointerEnter?.(e)
      }}
      onMouseEnter={(e) => {
        warmRoute(path)
        onMouseEnter?.(e)
      }}
      onFocus={(e) => {
        warmRoute(path)
        onFocus?.(e)
      }}
    />
  )
}