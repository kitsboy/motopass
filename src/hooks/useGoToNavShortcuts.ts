import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

const ROUTES: Record<string, string> = {
  p: '/programs',
  v: '/vault',
  a: '/agents',
}

/** Vim-style `g` then route key navigates (when not typing). */
export function useGoToNavShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    let pendingG = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const clearPending = () => {
      pendingG = false
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isEditableTarget(e.target)) return

      if (pendingG) {
        const route = ROUTES[e.key.toLowerCase()]
        if (route) {
          e.preventDefault()
          clearPending()
          navigate(route)
          return
        }
        clearPending()
      }

      if (e.key.toLowerCase() === 'g') {
        pendingG = true
        if (timer) clearTimeout(timer)
        timer = setTimeout(clearPending, 1000)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearPending()
    }
  }, [navigate])
}