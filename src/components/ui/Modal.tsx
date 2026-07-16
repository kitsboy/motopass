import { useEffect, useRef, type MutableRefObject, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { MODAL_BACKDROP_FADE, MODAL_SPRING_ENTER, MODAL_SPRING_EXIT } from '../../lib/ease'

export type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: ReactNode
  children: ReactNode
  maxWidth?: 'md' | 'lg' | 'xl'
  closeLabel?: string
  /** Optional opener element to restore focus on close (overrides auto-captured trigger). */
  returnFocusRef?: MutableRefObject<HTMLElement | null>
}

const MAX = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  icon,
  children,
  maxWidth = 'lg',
  closeLabel = 'Close',
  returnFocusRef,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotion()

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
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    })

    const openerAtMount = returnFocusRef?.current ?? null

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      const focusTarget = openerAtMount ?? triggerRef.current
      if (focusTarget?.isConnected) focusTarget.focus()
    }
  }, [open, onClose, returnFocusRef])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.button
            type="button"
            aria-label={closeLabel}
            className="absolute inset-0 modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : MODAL_BACKDROP_FADE}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={`relative w-full ${MAX[maxWidth]} max-h-[90dvh] flex flex-col modal-glass sm:rounded-2xl rounded-t-2xl overflow-hidden`}
            initial={reduced ? false : { opacity: 0, y: 44, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduced
                ? undefined
                : { opacity: 0, y: 28, scale: 0.975, transition: MODAL_SPRING_EXIT }
            }
            transition={reduced ? { duration: 0 } : MODAL_SPRING_ENTER}
            onClick={e => e.stopPropagation()}
          >
            <div className="shrink-0 px-5 sm:px-6 pt-5 pb-4 border-b border-mp/60 bg-card-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {icon && (
                    <div className="shrink-0 w-11 h-11 rounded-2xl bg-btc-orange-soft border border-btc-orange/30 flex items-center justify-center text-btc-orange shadow-mp-glow">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {eyebrow && <span className="club-eyebrow block mb-1.5">{eyebrow}</span>}
                    <h2 id="modal-title" className="font-display font-semibold text-lg sm:text-xl text-ink tracking-tight">
                      {title}
                    </h2>
                    {subtitle && <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">{subtitle}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 p-2.5 rounded-xl text-ink-muted hover:bg-section hover:text-ink transition-all hover:scale-105 active:scale-95"
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