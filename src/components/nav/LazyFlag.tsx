import { useEffect, useRef, useState } from 'react'

/** Renders emoji flags only when visible — defers layout cost until dropdown opens. */
export function LazyFlag({ flag, className = '', eager = false }: { flag: string; className?: string; eager?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [show, setShow] = useState(eager)

  useEffect(() => {
    if (eager) {
      setShow(true)
      return
    }
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true)
      return
    }
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