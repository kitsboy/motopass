import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: ReactNode
  children: ReactNode
  maxWidth?: 'md' | 'lg' | 'xl'
  closeLabel?: string
}

const MAX = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function ClassyModal({ open, onClose, title, subtitle, eyebrow, icon, children, maxWidth = 'lg', closeLabel = 'Close' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement as HTMLElement | null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      first?.focus()
    })

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      triggerRef.current?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.button
            type="button"
            aria-label={closeLabel}
            className="absolute inset-0 bg-ink/45 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="classy-modal-title"
            className={`relative w-full ${MAX[maxWidth]} max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-card border border-mp sm:rounded-mp-xl rounded-t-mp-xl shadow-card-hover overflow-hidden`}
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="shrink-0 px-5 sm:px-6 pt-5 pb-4 border-b border-mp bg-card-muted/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {icon && (
                    <div className="shrink-0 w-10 h-10 rounded-mp-md bg-btc-orange-soft border border-btc-orange/25 flex items-center justify-center text-btc-orange">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {eyebrow && (
                      <span className="font-mono text-eyebrow uppercase tracking-[0.2em] text-mp-btc-text block mb-1">
                        {eyebrow}
                      </span>
                    )}
                    <h2 id="classy-modal-title" className="font-display font-semibold text-lg sm:text-xl text-ink tracking-tight">
                      {title}
                    </h2>
                    {subtitle && <p className="text-xs text-ink-muted mt-1 leading-relaxed">{subtitle}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 p-2.5 rounded-mp-md text-ink-muted hover:bg-section hover:text-ink transition-colors"
                  aria-label={closeLabel}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 safe-bottom overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}