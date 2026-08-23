import { useId, useRef, useState, type ReactNode } from 'react'

/**
 * Lightweight hover/focus tooltip — wraps any element and shows an
 * educational tip above it. The panel is pointer-events-none so it never
 * intercepts clicks on the wrapped control.
 * Desktop: hover / focus reveals the tip (pointer-guarded so a synthesized
 * touch mouseenter can't pre-open it). Touch: tap toggles the tip open.
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
  const lastPointerRef = useRef<'mouse' | 'touch' | 'pen' | 'unknown'>('unknown')
  return (
    <span
      className={`relative inline-flex ${className}`}
      onPointerDown={(e) => {
        lastPointerRef.current = e.pointerType
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setOpen(false)
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        // Touch fallback: tap toggles the tip (guard so desktop clicks that
        // pass through to the wrapped control don't re-toggle it).
        if (lastPointerRef.current === 'touch' || lastPointerRef.current === 'pen') {
          e.stopPropagation()
          setOpen((v) => !v)
        }
      }}
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
