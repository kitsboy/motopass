/**
 * Best-effort artifact detection for the universal paste box.
 *
 * This only routes an artifact to the card that can read it. It does not
 * validate it and it never calls a network endpoint. Ambiguous inputs (a
 * Lightning address is also shaped like a NIP-05 name) return both options.
 */

export interface ToolDetection {
  id: string
  label: string
  value: string
  alternates?: Array<{ id: string; label: string }>
}

const BASE58 = /^[13][a-km-zA-HJ-NP-Z1-9]{25,39}$/
const BECH32_ADDRESS = /^(bc|tb|bcrt)1[02-9ac-hj-np-z]{8,}$/i
const BOLT11 = /^ln(bc|tb|bcrt|tbs)(\d+[munp]?)?1[02-9ac-hj-np-z]+$/i
const BOLT12 = /^ln[ori]1[02-9ac-hj-np-z]+$/i
const LNURL = /^lnurl1[02-9ac-hj-np-z]+$/i
const SILENT = /^(sp|tsp)1[02-9ac-hj-np-z]+$/i
const LIGHTNING_ADDRESS = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const HEX_PSBT = /^70736274ff[0-9a-f]+$/i
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

function decodeBase64Length(value: string): number | null {
  try {
    return atob(value).length
  } catch {
    return null
  }
}

function fromJson(value: string): ToolDetection | null {
  if (!value.startsWith('{')) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const kind = (parsed as { kind?: unknown }).kind
  if (kind === 9735) return { id: 'zap', label: 'NIP-57 zap receipt', value }
  if (kind === 1059 || kind === 21059) return { id: 'nip17', label: 'NIP-17 gift wrap', value }
  if (kind === 30078) return { id: 'receipt', label: 'Nostr receipt event', value }
  return null
}

export function detectTool(raw: string): ToolDetection | null {
  const original = raw.trim()
  if (!original) return null
  const value = original.replace(/^lightning:/i, '')

  const json = fromJson(original)
  if (json) return json

  if (BOLT11.test(value)) return { id: 'bolt11', label: 'BOLT11 invoice', value }
  if (BOLT12.test(value)) return { id: 'bolt12', label: 'BOLT12 message', value }
  if (LNURL.test(value)) return { id: 'lnurl', label: 'LNURL-pay link', value }
  if (SILENT.test(value)) return { id: 'silent-payments', label: 'Silent Payment address', value }
  if (BECH32_ADDRESS.test(value) || BASE58.test(value)) {
    return { id: 'address-psbt', label: 'Bitcoin address', value }
  }
  if (value.startsWith('cHNidP') || HEX_PSBT.test(value)) {
    return { id: 'address-psbt', label: 'PSBT', value }
  }
  if (LIGHTNING_ADDRESS.test(value)) {
    return {
      id: 'lnurl',
      label: 'Lightning address',
      value,
      alternates: [{ id: 'nip05', label: 'NIP-05 name' }],
    }
  }
  if (value.startsWith('smp') || value.startsWith('ful') || value.startsWith('pof')) {
    return { id: 'message-signature', label: 'BIP-322 signed-message proof', value }
  }
  if (BASE64.test(value) && decodeBase64Length(value) === 65) {
    const binary = atob(value)
    const header = binary.charCodeAt(0)
    if (header >= 27 && header <= 42) {
      return { id: 'message-signature', label: 'BIP-137 signed-message signature', value }
    }
  }
  return null
}
