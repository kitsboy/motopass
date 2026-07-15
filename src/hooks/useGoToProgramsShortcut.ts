import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

/** Vim-style `g` then `p` navigates to Programs (when not typing). */
export function useGoToProgramsShortcut() {
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

      if (pendingG && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        clearPending()
        navigate('/programs')
        return
      }

      if (e.key.toLowerCase() === 'g') {
        pendingG = true
        if (timer) clearTimeout(timer)
        timer = setTimeout(clearPending, 1000)
      } else if (pendingG) {
        clearPending()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearPending()
    }
  }, [navigate])
}