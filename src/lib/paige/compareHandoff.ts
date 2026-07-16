import type { Program } from '../../types/program'
import { retrievePrograms } from './retrieve'

const COMPARE_RE = /\bcompare\b/i
const THESE_TWO_RE = /\b(these two|both|them)\b/i

export function isCompareIntent(query: string): boolean {
  return COMPARE_RE.test(query) || THESE_TWO_RE.test(query)
}

/** Resolve program ids for a compare handoff from query and/or prior hit ids. */
export function resolveCompareHandoff(
  query: string,
  programs: Program[],
  priorHitIds: number[] = [],
): number[] | null {
  const fromQuery = retrievePrograms(programs, query, 4).map((h) => h.program.id)
  if (fromQuery.length >= 2) return fromQuery.slice(0, 4)

  if (isCompareIntent(query) && priorHitIds.length >= 2) {
    return priorHitIds.slice(0, 4)
  }

  return null
}

export function compareHandoffPath(ids: number[]): string {
  return `/compare?ids=${ids.join(',')}`
}