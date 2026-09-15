import { createContext, useContext } from 'react'

export type ToastVariant = 'default' | 'success' | 'error'

export type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void
}

/**
 * Context object + consumer hook only — the provider (and the toast stack it
 * renders) lives in `./ToastProvider`. See the note in context/ThemeContext.tsx
 * for why: `react-refresh/only-export-components`, with consumer import paths
 * unchanged (every `useToast` import keeps working).
 */
export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
