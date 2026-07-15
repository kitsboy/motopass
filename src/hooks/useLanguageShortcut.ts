import { useEffect } from 'react'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

function openVisibleLanguageDropdown(): void {
  const triggers = document.querySelectorAll<HTMLButtonElement>('[data-language-trigger]')
  for (const btn of triggers) {
    if (btn.offsetParent !== null) {
      btn.click()
      btn.focus()
      return
    }
  }
}

/** ⌘L / Ctrl+L opens the visible language dropdown. */
export function useLanguageShortcut() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'l') return
      if (e.altKey || e.shiftKey) return
      if (isEditableTarget(e.target)) return

      e.preventDefault()
      openVisibleLanguageDropdown()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}