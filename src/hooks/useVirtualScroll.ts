import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'

type VirtualScrollOptions = {
  itemCount: number
  itemHeight: number
  overscan?: number
  enabled?: boolean
}

type VirtualScrollResult = {
  startIndex: number
  endIndex: number
  offsetY: number
  totalHeight: number
  onScroll: () => void
}

/** Lightweight windowed list for long merchant directories (item 724). */
export function useVirtualScroll(
  containerRef: RefObject<HTMLElement | null>,
  { itemCount, itemHeight, overscan = 4, enabled = true }: VirtualScrollOptions,
): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
  }, [containerRef])

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setViewportHeight(el.clientHeight)
    setScrollTop(el.scrollTop)
  }, [containerRef])

  useEffect(() => {
    if (!enabled) return
    measure()
    const el = containerRef.current
    if (!el) return

    el.addEventListener('scroll', onScroll, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', onScroll)
      ro?.disconnect()
    }
  }, [containerRef, enabled, measure, onScroll, itemCount])

  return useMemo(() => {
    if (!enabled || itemCount === 0) {
      return {
        startIndex: 0,
        endIndex: itemCount,
        offsetY: 0,
        totalHeight: itemCount * itemHeight,
        onScroll,
      }
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2
    const endIndex = Math.min(itemCount, startIndex + visibleCount)

    return {
      startIndex,
      endIndex,
      offsetY: startIndex * itemHeight,
      totalHeight: itemCount * itemHeight,
      onScroll,
    }
  }, [enabled, itemCount, itemHeight, onScroll, overscan, scrollTop, viewportHeight])
}