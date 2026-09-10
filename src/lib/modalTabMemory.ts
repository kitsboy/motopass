const KEY = 'mp.modal.tab'

/**
 * Remembers the last active tab per user across modal sessions
 * (localStorage, silently ignored when unavailable).
 */
export function loadLastModalTab(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveLastModalTab(tab: string): void {
  try {
    window.localStorage.setItem(KEY, tab)
  } catch {
    /* storage unavailable — memory is a nicety, not a requirement */
  }
}
