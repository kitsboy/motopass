import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

type Props = { compact?: boolean }

export function ThemeToggle({ compact }: Props) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={
        compact
          ? 'p-2 rounded-mp-md text-ink-muted hover:bg-section hover:text-ink transition-colors'
          : 'chip flex items-center gap-1.5 !py-1.5 hover:!border-btc-orange/40'
      }
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun size={compact ? 18 : 14} /> : <Moon size={compact ? 18 : 14} />}
      {!compact && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  )
}