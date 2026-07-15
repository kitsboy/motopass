import type { ReactNode } from 'react'
import { useScrollProgress } from '../hooks/useScrollProgress'

type HeaderProps = {
  children: ReactNode
  className?: string
}

export function Header({ children, className = '', collapsed = false }: HeaderProps & { collapsed?: boolean }) {
  const scrollProgress = useScrollProgress()

  return (
    <header className={`club-header nav-header ${collapsed ? 'club-header--collapsed' : ''} ${className}`.trim()}>
      <div
        className="header-scroll-progress"
        role="progressbar"
        aria-hidden
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollProgress * 100)}
        style={{ transform: `scaleX(${scrollProgress})` }}
      />
      <div className="club-header-bg" aria-hidden>
        <div className="club-header-hash-layer" />
        <div className="club-header-glow" />
        <div className="club-header-glow-electric" />
      </div>
      <div className="club-header-surface">{children}</div>
    </header>
  )
}