import React, { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import { ToastContext, type ToastItem, type ToastVariant } from './Toast'

let toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = ++toastId
    setItems(prev => [...prev.slice(-2), { id, message, variant }])
    window.setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-20 lg:bottom-6 right-4 z-[70] flex flex-col gap-2 max-w-sm pointer-events-none"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map(item => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2 rounded-mp-lg border px-4 py-3 text-sm shadow-mp-3 backdrop-blur-md transition-all duration-fast ${
              item.variant === 'success'
                ? 'border-mp-proof/40 bg-mp-proof/10 text-ink'
                : item.variant === 'error'
                  ? 'border-status-red/40 bg-status-red/10 text-ink'
                  : 'border-mp/60 bg-card/95 text-ink'
            }`}
          >
            {item.variant === 'success' && <Check size={16} className="text-mp-proof shrink-0 mt-0.5" aria-hidden />}
            {item.variant === 'error' && <AlertTriangle size={16} className="text-status-red shrink-0 mt-0.5" aria-hidden />}
            <span className="flex-1 font-chrome leading-snug">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="shrink-0 p-0.5 rounded-mp-sm text-ink-muted hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
