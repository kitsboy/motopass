export type DensityTier = 'sparse' | 'moderate' | 'dense'

export type ProgramDensity = {
  count: number
  tier: DensityTier
  score: number
}

export type DensitySnapshot = {
  generatedAt: string
  programs: Record<string, ProgramDensity>
}

export function densityTier(count: number): DensityTier {
  if (count >= 20) return 'dense'
  if (count >= 5) return 'moderate'
  return 'sparse'
}

let cache: DensitySnapshot | null = null

export async function loadDensitySnapshot(): Promise<DensitySnapshot> {
  if (cache) return cache
  const res = await fetch('/data/btcmap-density.json')
  if (!res.ok) throw new Error('density_load_failed')
  cache = (await res.json()) as DensitySnapshot
  return cache
}

export function getProgramDensity(snapshot: DensitySnapshot | null, programName: string): ProgramDensity | null {
  if (!snapshot) return null
  return snapshot.programs[programName] ?? null
}