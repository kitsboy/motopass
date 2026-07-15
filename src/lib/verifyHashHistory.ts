const STORAGE_KEY = 'motopass-verify-hash-history'
const MAX_ENTRIES = 5

export type HashHistoryEntry = {
  hash: string
  label?: string
  ts: string
}

function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash)
}

export function loadHashHistory(): HashHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (e): e is HashHistoryEntry =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as HashHistoryEntry).hash === 'string' &&
          typeof (e as HashHistoryEntry).ts === 'string' &&
          isValidHash((e as HashHistoryEntry).hash),
      )
      .slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

export function pushHashHistory(hash: string, label?: string): HashHistoryEntry[] {
  const normalized = hash.trim().toLowerCase()
  if (!isValidHash(normalized)) return loadHashHistory()

  const next: HashHistoryEntry = {
    hash: normalized,
    label: label?.trim() || undefined,
    ts: new Date().toISOString(),
  }

  const deduped = loadHashHistory().filter(e => e.hash !== normalized)
  const history = [next, ...deduped].slice(0, MAX_ENTRIES)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  return history
}

export function clearHashHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}