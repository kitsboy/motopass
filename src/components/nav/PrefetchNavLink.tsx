import { NavLink, type NavLinkProps } from 'react-router-dom'
import { prefetchRoute } from '../../lib/prefetchRoutes'

function routePath(to: NavLinkProps['to']): string {
  if (typeof to === 'string') return to
  return to.pathname ?? ''
}

export function PrefetchNavLink({ onMouseEnter, onFocus, to, ...props }: NavLinkProps) {
  const path = routePath(to)
  return (
    <NavLink
      {...props}
      to={to}
      onMouseEnter={(e) => {
        prefetchRoute(path)
        onMouseEnter?.(e)
      }}
      onFocus={(e) => {
        prefetchRoute(path)
        onFocus?.(e)
      }}
    />
  )
}