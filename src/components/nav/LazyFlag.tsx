import { useEffect, useRef, useState } from 'react'

/** Renders emoji flags only when visible — defers layout cost until dropdown opens. */
export function LazyFlag({ flag, className = '', eager = false }: { flag: string; className?: string; eager?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  // Lazy-init covers both triggers the old effect handled synchronously:
  // eager prop, and environments with no IntersectionObserver (show immediately).
  const [show, setShow] = useState(eager || typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (eager) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '48px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [eager])

  return (
    <span ref={ref} className={className} aria-hidden="true">
      {show ? flag : '\u00A0'}
    </span>
  )
}