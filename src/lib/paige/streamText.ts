/** Typewriter streaming stub — ms per character (stub-safe, not real LLM streaming). */
export const PAIGE_CHAR_MS = 14

export function nextStreamIndex(displayed: number, fullLength: number, reduceMotion: boolean): number {
  if (reduceMotion || displayed >= fullLength) return fullLength
  return Math.min(fullLength, displayed + 1)
}

export function isStreamComplete(displayed: number, fullLength: number): boolean {
  return displayed >= fullLength
}