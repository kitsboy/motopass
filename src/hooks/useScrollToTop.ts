import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scroll to top on route change — batch 12 item 279 */
export function useScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' })
  }, [pathname])
}