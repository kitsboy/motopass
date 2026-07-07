import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

type Props = { compact?: boolean }

export function ThemeToggle({ compact }: Props) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="nav-btn nav-btn-icon"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <Sun size={16} strokeWidth={2.25} /> : <Moon size={16} strokeWidth={2.25} />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="nav-btn w-full justify-center"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={14} strokeWidth={2.25} /> : <Moon size={14} strokeWidth={2.25} />}
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}