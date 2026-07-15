import { useEffect, useState } from 'react'

/** Tracks document visibility — pauses cinematic / parallax when tab is hidden. */
export function useTabVisible() {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden,
  )

  useEffect(() => {
    const onChange = () => {
      const isVisible = !document.hidden
      setVisible(isVisible)
      document.documentElement.classList.toggle('tab-hidden', !isVisible)
    }
    onChange()
    document.addEventListener('visibilitychange', onChange)
    return () => {
      document.removeEventListener('visibilitychange', onChange)
      document.documentElement.classList.remove('tab-hidden')
    }
  }, [])

  return visible
}