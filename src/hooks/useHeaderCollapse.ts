import { useEffect, useRef, useState } from 'react'

/** Slim header on scroll-down; restore on scroll-up (mobile + desktop). */
export function useHeaderCollapse(threshold = 48) {
  const [collapsed, setCollapsed] = useState(false)
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    lastY.current = window.scrollY

    const update = () => {
      const y = window.scrollY
      if (y <= threshold) {
        setCollapsed(false)
      } else if (y > lastY.current + 6) {
        setCollapsed(true)
      } else if (y < lastY.current - 6) {
        setCollapsed(false)
      }
      lastY.current = y
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return collapsed
}