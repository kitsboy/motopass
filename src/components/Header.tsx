import type { ReactNode } from 'react'
import { useHeaderScrollDepth } from '../hooks/useHeaderScrollDepth'

type HeaderProps = {
  children: ReactNode
  className?: string
}

export function Header({ children, className = '', collapsed = false }: HeaderProps & { collapsed?: boolean }) {
  const scrollDeep = useHeaderScrollDepth(200)

  return (
    <header
      className={`club-header nav-header ${collapsed ? 'club-header--collapsed' : ''} ${collapsed && scrollDeep ? 'club-header--scroll-deep' : ''} ${className}`.trim()}
    >

      <div className="club-header-bg" aria-hidden>
        <div className="club-header-hash-layer club-header-hash-primary" />
        <div className="club-header-hash-layer club-header-hash-secondary" />
        <div className="club-header-grain" />
        <div className="club-header-glow" />
        <div className="club-header-glow-electric" />
        <div className="club-header-vignette" />
      </div>
      <div className="club-header-surface">{children}</div>
    </header>
  )
}