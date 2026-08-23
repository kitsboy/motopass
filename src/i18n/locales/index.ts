import type { Dict } from '../translations'

// Vite code-splits each locale into its own lazy chunk via import.meta.glob.
// Only the requested language's chunk is fetched — the other 9 are not on the
// first-paint path. Keys are './<lang>.ts' for the 2-letter codes in this dir.
const loaders = import.meta.glob<Partial<Dict>>('./[a-z][a-z].ts', { import: 'default' })

/**
 * Dynamically load a locale dictionary. Returns null for unknown languages.
 * Throws if the chunk fails to load (caller should fall back to English).
 * Locales are partial — missing keys fall back to English via `t`.
 */
export function loadLocale(lang: string): Promise<Partial<Dict>> | null {
  const loader = loaders[`./${lang}.ts`]
  return loader ? loader() : null
}
