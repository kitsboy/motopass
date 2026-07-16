export const PAIGE_HISTORY_KEY = 'motopass-paige-history'
export const PAIGE_HISTORY_MAX = 10

export type StoredUserMsg = { role: 'user'; text: string }
export type StoredPaigeTextMsg = { role: 'paige'; kind: 'text'; text: string }
export type StoredPaigeHitsMsg = { role: 'paige'; kind: 'hits'; programIds: number[] }
export type StoredPaigeCompareMsg = { role: 'paige'; kind: 'compare'; programIds: number[]; label: string }
export type StoredMsg = StoredUserMsg | StoredPaigeTextMsg | StoredPaigeHitsMsg | StoredPaigeCompareMsg

export function trimPaigeHistory(messages: StoredMsg[]): StoredMsg[] {
  return messages.slice(-PAIGE_HISTORY_MAX)
}

export function loadPaigeHistory(): StoredMsg[] {
  try {
    const raw = localStorage.getItem(PAIGE_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return trimPaigeHistory(parsed.filter(isStoredMsg))
  } catch {
    return []
  }
}

export function savePaigeHistory(messages: StoredMsg[]): void {
  localStorage.setItem(PAIGE_HISTORY_KEY, JSON.stringify(trimPaigeHistory(messages)))
}

export function clearPaigeHistory(): void {
  localStorage.removeItem(PAIGE_HISTORY_KEY)
}

function isStoredMsg(value: unknown): value is StoredMsg {
  if (!value || typeof value !== 'object') return false
  const m = value as StoredMsg
  if (m.role === 'user') return typeof m.text === 'string'
  if (m.role !== 'paige') return false
  if (m.kind === 'text') return typeof m.text === 'string'
  if (m.kind === 'hits' || m.kind === 'compare') {
    return Array.isArray(m.programIds) && m.programIds.every((id) => Number.isFinite(id))
  }
  return false
}