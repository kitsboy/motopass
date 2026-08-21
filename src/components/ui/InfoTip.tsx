import { useId, useState, type ReactNode } from 'react'

/**
 * Lightweight hover/focus tooltip — wraps any element and shows an
 * educational tip above it. The panel is pointer-events-none so it never
 * intercepts clicks on the wrapped control. Mobile: labels on the wrapped
 * control stay visible; the tip is enrichment for mouse users.
 */
export function InfoTip({
  tip,
  children,
  className = '',
}: {
  tip: ReactNode
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-max max-w-[17rem] -translate-x-1/2 whitespace-normal rounded-mp-lg border border-mp/60 bg-card/95 px-3 py-2 text-left font-body text-[11px] leading-relaxed text-ink-secondary shadow-mp-3 backdrop-blur-md"
        >
          {tip}
        </span>
      )}
    </span>
  )
}
