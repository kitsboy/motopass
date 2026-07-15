import type { ReactNode } from 'react'

type HeaderProps = {
  children: ReactNode
  className?: string
}

export function Header({ children, className = '' }: HeaderProps) {
  return (
    <header className={`club-header nav-header ${className}`.trim()}>
      <div className="club-header-bg" aria-hidden>
        <div className="club-header-glow" />
        <div className="club-header-glow-electric" />
      </div>
      <div className="club-header-surface">{children}</div>
    </header>
  )
}