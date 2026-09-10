import { useRef } from 'react'
import type { TouchEvent } from 'react'

/**
 * Recognizes deliberate horizontal flicks on touch devices and maps them to
 * next/previous tab navigation. Never calls preventDefault, so vertical
 * scrolling of the modal body is unaffected — only a gesture that is clearly
 * horizontal-dominant and fast enough to be intentional switches tabs.
 */
export function useTabSwipe(opts: { onNext: () => void; onPrev: () => void }) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null)

  const onTouchStart = (e: TouchEvent<HTMLElement>) => {
    const touch = e.touches[0]
    if (!touch) return
    start.current = { x: touch.clientX, y: touch.clientY, t: Date.now() }
  }

  const onTouchEnd = (e: TouchEvent<HTMLElement>) => {
    const s = start.current
    start.current = null
    if (!s) return
    const touch = e.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - s.x
    const dy = touch.clientY - s.y
    const dt = Date.now() - s.t
    // Horizontal-dominant, meaningful distance, quick flick, no vertical fight
    if (dt > 500 || Math.abs(dx) < 56 || Math.abs(dy) > Math.abs(dx) * 0.7) return
    if (dx < 0) opts.onNext()
    else opts.onPrev()
  }

  return { onTouchStart, onTouchEnd }
}
