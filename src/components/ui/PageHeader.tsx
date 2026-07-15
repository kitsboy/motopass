import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  description?: string
  actions?: ReactNode
}) {
  const body = description ?? subtitle
  const reduceMotion = useReducedMotion()

  const headerProps = reduceMotion
    ? {
        className:
          'page-header-accent flex flex-col gap-6 border-b border-mp-border-subtle/60 pb-8 mb-8 sm:flex-row sm:items-end sm:justify-between',
      }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
        className:
          'page-header-accent flex flex-col gap-6 border-b border-mp-border-subtle/60 pb-8 mb-8 sm:flex-row sm:items-end sm:justify-between',
      }

  const Header = reduceMotion ? 'header' : motion.header

  return (
    <Header {...headerProps}>
      <div className="max-w-2xl min-w-0">
        {eyebrow && <span className="club-eyebrow block mb-3">{eyebrow}</span>}
        <h1 className="font-display text-h2 font-semibold tracking-tight text-mp-ink sm:text-h1">{title}</h1>
        {body && (
          <p className="mt-3.5 max-w-xl font-body text-body text-mp-ink-secondary leading-relaxed">{body}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </Header>
  )
}