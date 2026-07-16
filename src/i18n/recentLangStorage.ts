import type { LangCode } from './languages'

const RECENT_LANGS_KEY = 'motopass-recent-langs'
const MAX_RECENT = 3

export function loadRecentLangs(): LangCode[] {
  try {
    const raw = localStorage.getItem(RECENT_LANGS_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed.filter(Boolean) as LangCode[]).slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

export function rememberRecentLang(code: LangCode) {
  const prev = loadRecentLangs().filter(l => l !== code)
  localStorage.setItem(RECENT_LANGS_KEY, JSON.stringify([code, ...prev].slice(0, MAX_RECENT)))
}