import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
      <div className="max-w-2xl">
        {eyebrow && <div className="section-label mb-2">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-2 leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}