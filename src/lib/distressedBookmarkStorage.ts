export const DISTRESSED_BOOKMARKS_KEY = 'motopass-distressed-bookmarks'

export function loadDistressedBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(DISTRESSED_BOOKMARKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
  } catch {
    return []
  }
}

export function saveDistressedBookmarks(ids: string[]): void {
  localStorage.setItem(DISTRESSED_BOOKMARKS_KEY, JSON.stringify([...new Set(ids)]))
}

export function toggleDistressedBookmark(listingId: string): string[] {
  const current = loadDistressedBookmarks()
  const next = current.includes(listingId)
    ? current.filter(id => id !== listingId)
    : [...current, listingId]
  saveDistressedBookmarks(next)
  return next
}

export function isDistressedBookmarked(listingId: string, bookmarks?: string[]): boolean {
  const list = bookmarks ?? loadDistressedBookmarks()
  return list.includes(listingId)
}