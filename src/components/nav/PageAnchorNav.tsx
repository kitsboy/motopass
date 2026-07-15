import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'

export type PageAnchor = {
  id: string
  label: string
}

type PageAnchorNavProps = {
  items: PageAnchor[]
}

export function PageAnchorNav({ items }: PageAnchorNavProps) {
  const { t } = useI18n()
  const [active, setActive] = useState(items[0]?.id ?? '')
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!items.length) return

    const sections = items
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el)

    if (!sections.length) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) setActive(visible[0].target.id)
      },
      {
        rootMargin: '-40% 0px -45% 0px',
        threshold: [0, 0.15, 0.35, 0.55],
      },
    )

    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [items])

  if (items.length < 2) return null

  const scrollTo = (id: string) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
  }

  return (
    <nav
      ref={navRef}
      aria-label={t('nav.pageSections')}
      className="page-anchor-nav hidden lg:block mb-6 -mt-1"
    >
      <div className="page-anchor-nav-inner">
        <ul className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {items.map(item => {
            const isActive = item.id === active
            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`page-anchor-link ${isActive ? 'page-anchor-link-active' : ''}`}
                >
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}