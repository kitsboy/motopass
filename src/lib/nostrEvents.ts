/** Kind 30078-style program update stub for Nostr broadcast */
export interface ProgramUpdateEvent {
  kind: 30078
  content: string
  tags: string[][]
  created_at: number
}

export function buildProgramUpdateEvent(programName: string, change: string, satohashUrl?: string): ProgramUpdateEvent {
  const tags: string[][] = [
    ['d', `motopass-program-${programName.toLowerCase().replace(/\s+/g, '-')}`],
    ['t', 'motopass'],
    ['t', 'program-update'],
  ]
  if (satohashUrl) tags.push(['satohash', satohashUrl])

  return {
    kind: 30078,
    content: JSON.stringify({ program: programName, change, platform: 'MotoPass' }),
    tags,
    created_at: Math.floor(Date.now() / 1000),
  }
}

export function serializeNostrEvent(event: ProgramUpdateEvent): string {
  return JSON.stringify(event, null, 2)
}