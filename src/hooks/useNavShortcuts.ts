import { useEffect, useState } from 'react'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

/** `?` opens the nav keyboard shortcuts cheat sheet (when not typing). */
export function useNavShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return
      if (isEditableTarget(e.target)) return

      e.preventDefault()
      setOpen(v => !v)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return { shortcutsOpen: open, setShortcutsOpen: setOpen }
}