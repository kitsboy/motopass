import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/**
 * Context object + consumer hook only — the provider lives in `./ThemeProvider`.
 *
 * `react-refresh/only-export-components` requires a module to export either
 * components or non-components, never both: a file that does both cannot be
 * hot-replaced, so Vite falls back to a full page reload. Keeping the context
 * and its hook here (and the component in its own file) fixes that AND leaves
 * every existing `useTheme` import path untouched.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
