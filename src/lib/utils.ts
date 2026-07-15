export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

const WORDS_PER_MINUTE = 200

/** Estimate reading time from one or more text blocks (min 1 minute). */
export function estimateReadingMinutes(...texts: string[]): number {
  const words = texts
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}