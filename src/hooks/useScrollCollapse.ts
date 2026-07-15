import { useEffect, useRef, useState, type RefObject } from 'react'

/** Collapse a sticky panel when scrolling down inside a container; restore on scroll-up or at top. */
export function useScrollCollapse(
  scrollRef: RefObject<HTMLElement | null>,
  { threshold = 12, enabled = true } = {},
) {
  const [collapsed, setCollapsed] = useState(false)
  const lastTop = useRef(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !enabled) {
      setCollapsed(false)
      return
    }

    lastTop.current = el.scrollTop

    const onScroll = () => {
      const top = el.scrollTop
      if (top <= threshold) {
        setCollapsed(false)
      } else if (top > lastTop.current + 6) {
        setCollapsed(true)
      } else if (top < lastTop.current - 6) {
        setCollapsed(false)
      }
      lastTop.current = top
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollRef, threshold, enabled])

  return collapsed
}