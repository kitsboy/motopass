export type FeeRail = 'bitcoin' | 'dollars' | 'unpriced' | 'fiat'

export interface FeeLine {
  rail: FeeRail
  usd: number | null
}

export interface FeeInvoice {
  lines: FeeLine[]
  /** True when this note is more than a plain refusal. */
  featured: boolean
}

function firstMillionBefore(note: string, marker: RegExp): number | null {
  const at = note.search(marker)
  if (at < 0) return null
  const window = note.slice(Math.max(0, at - 90), at)
  const match = window.match(/([\d.]+)\s*million/i)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 1_000_000)
}

/**
 * Split a fee note into lines the text already supports.
 * A Bitcoin line exists only when the note says an amount can be paid in Bitcoin.
 */
export function feeInvoice(note: string | null | undefined, govFeesUsd: number | null): FeeInvoice {
  const text = note?.trim() ?? ''
  if (!text) return { featured: false, lines: [{ rail: 'fiat', usd: null }] }

  const bitcoinUsd = firstMillionBefore(text, /can be paid in Bitcoin/i)
  if (bitcoinUsd != null) {
    const lines: FeeLine[] = [{ rail: 'bitcoin', usd: bitcoinUsd }]
    if (/not Bitcoin|US dollars only/i.test(text) && govFeesUsd != null && govFeesUsd > 0) {
      lines.push({ rail: 'dollars', usd: govFeesUsd })
    }
    return { featured: true, lines }
  }

  if (/source of funds|proof of source/i.test(text)) {
    return { featured: true, lines: [{ rail: 'dollars', usd: govFeesUsd && govFeesUsd > 0 ? govFeesUsd : null }] }
  }

  if (/^partial/i.test(text)) {
    return { featured: true, lines: [{ rail: 'unpriced', usd: null }] }
  }

  return { featured: false, lines: [{ rail: 'fiat', usd: null }] }
}
