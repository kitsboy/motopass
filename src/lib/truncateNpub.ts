/** Truncate npub for display — keeps prefix and suffix */
export function truncateNpub(npub: string, head = 12, tail = 4): string {
  if (npub.length <= head + tail + 1) return npub
  return `${npub.slice(0, head)}…${npub.slice(-tail)}`
}