import { useEffect, useState } from 'react'

/** True when document scroll exceeds threshold (for intensified collapsed header shadow). */
export function useHeaderScrollDepth(threshold = 200) {
  const [deep, setDeep] = useState(false)

  useEffect(() => {
    const update = () => setDeep(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  return deep
}