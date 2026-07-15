import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

type BackToTopProps = {
  /** Scroll offset before showing the button (px). */
  threshold?: number
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function BackToTop({ threshold = 480 }: BackToTopProps) {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => {
      const y = window.scrollY
      if (y < threshold) {
        setVisible(false)
        return
      }
      const hasAnchorNav = document.querySelector('.page-anchor-nav') !== null
      if (hasAnchorNav) {
        setVisible(true)
        return
      }
      const doc = document.documentElement
      const isLongPage = doc.scrollHeight > window.innerHeight * 1.75
      setVisible(isLongPage)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [threshold, pathname])

  if (!visible) return null

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  return (
    <button
      type="button"
      className="back-to-top"
      onClick={scrollToTop}
      aria-label={t('nav.backToTop')}
      title={t('nav.backToTop')}
    >
      <ArrowUp size={18} strokeWidth={2.25} aria-hidden="true" />
    </button>
  )
}