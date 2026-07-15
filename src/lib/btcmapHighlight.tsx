import type { ReactNode } from 'react'

/** Highlight search query matches in merchant list rows (item 629). */
export function highlightMatches(text: string, query: string): ReactNode {
  if (!query.trim() || !text) return text

  const q = query.trim()
  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  const parts: ReactNode[] = []
  let cursor = 0
  let matchIdx = lower.indexOf(needle, cursor)

  while (matchIdx !== -1) {
    if (matchIdx > cursor) parts.push(text.slice(cursor, matchIdx))
    parts.push(
      <mark key={`${matchIdx}-${cursor}`} className="btcmap-match bg-btc-orange-soft text-mp-btc-text rounded-sm px-0.5">
        {text.slice(matchIdx, matchIdx + needle.length)}
      </mark>,
    )
    cursor = matchIdx + needle.length
    matchIdx = lower.indexOf(needle, cursor)
  }

  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}