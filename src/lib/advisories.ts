import type { TranslationKey } from '../i18n/translations'

export interface UsAdvice {
  level: number | null
  label: string
  summary: string
  href: string
  updated: string | null
}

export interface UkAdvice {
  alert_status: string[]
  change: string
  updated: string | null
  href: string
}

export interface ArAdvice {
  title: string
  detail: string
  href: string
}

export interface AdvisoryFile {
  fetched_at: string
  us: { source: string; audience: string; error: string | null }
  uk: { source: string; audience: string; error: string | null }
  ar: { source: string; audience: string; error: string | null }
  by_iso: Record<string, { us: UsAdvice | null; uk: UkAdvice | null; ar: ArAdvice[] }>
  argentina_alerts: Array<ArAdvice & { matches: string[] }>
}

const UK_KEYS: Record<string, TranslationKey> = {
  avoid_all_travel: 'advice.ukAvoidAll',
  avoid_all_but_essential_travel: 'advice.ukAvoidEssential',
  avoid_all_travel_to_parts: 'advice.ukAvoidAllParts',
  avoid_all_but_essential_travel_to_parts: 'advice.ukAvoidEssentialParts',
}

/** Known UK warning codes become a sentence. An unknown code stays a code. */
export function ukStatusKey(code: string): TranslationKey | null {
  return UK_KEYS[code] ?? null
}
