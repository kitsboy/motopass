const SATOHASH_BASE = import.meta.env.VITE_SATOHASH_URL || 'https://satohash.io'

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function satohashVerifyUrl(hash: string): string {
  return `${SATOHASH_BASE}/verify/${hash}`
}

export function satohashStampGuideUrl(hash: string): string {
  return `${SATOHASH_BASE}/stamp?hash=${hash}`
}

export async function hashApplicationPayload(payload: Record<string, unknown>): Promise<string> {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort())
  return sha256Hex(canonical)
}

export async function fetchBitcoinBlockHeight(): Promise<number | null> {
  try {
    const res = await fetch('https://mempool.space/api/blocks/tip/height')
    if (!res.ok) return null
    return Number(await res.text())
  } catch {
    return null
  }
}