import { LANGUAGES, type LangCode, type LangPreference } from './languages'

export const ROUTE_LANG_KEY = 'motopass-lang-by-route'

export type RouteLangMap = Record<string, LangPreference>

function isLangPreference(value: unknown): value is LangPreference {
  if (value === 'system') return true
  return typeof value === 'string' && LANGUAGES.some(l => l.code === value)
}

export function readRouteLangMap(): RouteLangMap {
  try {
    const raw = localStorage.getItem(ROUTE_LANG_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const map: RouteLangMap = {}
    for (const [path, pref] of Object.entries(parsed)) {
      if (typeof path === 'string' && isLangPreference(pref)) {
        map[path] = pref
      }
    }
    return map
  } catch {
    return {}
  }
}

export function writeRouteLangMap(map: RouteLangMap): void {
  localStorage.setItem(ROUTE_LANG_KEY, JSON.stringify(map))
}

export function saveRouteLang(path: string, pref: LangPreference): void {
  const map = readRouteLangMap()
  map[path] = pref
  writeRouteLangMap(map)
}

export function getRouteLang(path: string): LangPreference | undefined {
  return readRouteLangMap()[path]
}

export function isResolvedLangCode(pref: LangPreference): pref is LangCode {
  return pref !== 'system'
}