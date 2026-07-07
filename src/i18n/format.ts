import type { TranslationKey } from './translations'

/** Replace `{var}` placeholders in translated strings */
export function formatT(
  t: (key: TranslationKey) => string,
  key: TranslationKey,
  vars: Record<string, string | number>,
): string {
  let out = t(key)
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(`{${k}}`, String(v))
  }
  return out
}