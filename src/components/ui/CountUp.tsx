import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useInView } from 'motion/react'

interface CountUpProps {
  value: number
  /** Render the number — format here (e.g. `$${v.toLocaleString()}`). */
  format?: (v: number) => string
  durationMs?: number
  className?: string
}

/**
 * Animates a number rising from zero (or a previous value) when it scrolls
 * into view. Fires once per mount-in, respects prefers-reduced-motion by
 * rendering the final value instantly, and never re-animates on re-renders
 * unless the target value actually changes.
 */
export function CountUp({ value, format = v => v.toLocaleString(), durationMs = 900, className }: CountUpProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const [display, setDisplay] = useState(reduceMotion ? value : 0)
  const fromRef = useRef(0)

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      setDisplay(value)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      // easeOutExpo — fast rise, gentle settle
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setDisplay(Math.round(from + (value - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, durationMs, reduceMotion])

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  )
}
