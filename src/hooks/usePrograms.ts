import { useEffect, useState } from 'react'
import type { Program } from '../types/program'

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/research/countries.json')
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json() })
      .then(d => setPrograms(d.programs ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { programs, loading, error, byId: (id: number) => programs.find(p => p.id === id) }
}