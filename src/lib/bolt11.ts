import { bech32Decode, bytesToHex, wordsToBytes, wordsToInt } from './bech32'

/**
 * BOLT11 invoice decoding, in the browser.
 *
 * This reads the fields a wallet puts in the invoice — amount, timestamp,
 * expiry, payment hash, description, payee key — and checks the bech32
 * checksum. It does **not** verify the invoice signature: that needs recovering
 * the payee key, and a decoder that quietly skipped it would still look like a
 * verification to the visitor. The UI labels the result as decoded, not proven.
 */

export type Bolt11Network = 'bitcoin' | 'testnet' | 'signet' | 'regtest' | 'unknown'

export interface Bolt11Invoice {
  network: Bolt11Network
  amountMsat: number | null
  /** The amount as written in the HRP, e.g. `2500u`; null when open. */
  amountText: string | null
  timestamp: number
  expirySeconds: number
  expiresAt: number
  paymentHash: string | null
  description: string | null
  descriptionHash: string | null
  payeeNodeKey: string | null
  features: string | null
  minFinalCltv: number | null
  fallbackAddress: string | null
  routeHintCount: number
  signature: string
  unknownTags: number[]
  warnings: string[]
}

export type Bolt11Result =
  | { ok: true; invoice: Bolt11Invoice }
  | { ok: false; error: string }

const NETWORKS: { prefix: string; network: Bolt11Network }[] = [
  { prefix: 'bcrt', network: 'regtest' },
  { prefix: 'tbs', network: 'signet' },
  { prefix: 'tb', network: 'testnet' },
  { prefix: 'bc', network: 'bitcoin' },
]

const MSAT_PER_UNIT: Record<string, number> = {
  '': 100_000_000_000,
  m: 100_000_000,
  u: 100_000,
  n: 100,
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

function parseHrp(hrp: string):
  | { ok: true; network: Bolt11Network; amountText: string | null; amountMsat: number | null }
  | { ok: false; error: string } {
  if (!hrp.startsWith('ln')) return { ok: false, error: 'Not a BOLT11 invoice — expected lnbc…' }
  const rest = hrp.slice(2)
  const match = NETWORKS.find(entry => rest.startsWith(entry.prefix))
  if (!match) return { ok: false, error: 'Unknown BOLT11 network prefix' }

  const amountText = rest.slice(match.prefix.length)
  if (!amountText) return { ok: true, network: match.network, amountText: null, amountMsat: null }

  const amount = amountText.match(/^(\d+)([munp]?)$/)
  if (!amount) return { ok: false, error: 'Invoice amount is not a whole number with a valid multiplier' }
  const value = Number(amount[1])
  const multiplier = amount[2]
  if (!Number.isSafeInteger(value)) return { ok: false, error: 'Invoice amount is too large to read' }

  if (multiplier === 'p') {
    if (value % 10 !== 0) {
      return { ok: false, error: 'Pico-bitcoin amount is not a whole millisecond' }
    }
    return { ok: true, network: match.network, amountText, amountMsat: value / 10 }
  }

  const msat = value * MSAT_PER_UNIT[multiplier]
  if (!Number.isSafeInteger(msat)) return { ok: false, error: 'Invoice amount is too large to read' }
  return { ok: true, network: match.network, amountText, amountMsat: msat }
}

export function decodeBolt11(raw: string): Bolt11Result {
  const cleaned = raw
    .trim()
    .replace(/^lightning:/i, '')
    .replace(/\s+/g, '')
  if (!cleaned) return { ok: false, error: 'Paste a BOLT11 invoice first' }

  const decoded = bech32Decode(cleaned, { checksum: true })
  if (!decoded.ok) return { ok: false, error: decoded.error }
  if (!decoded.hrp.startsWith('ln')) {
    return { ok: false, error: 'That checksum is valid, but the prefix is not a Lightning invoice' }
  }

  const parsedHrp = parseHrp(decoded.hrp)
  if (!parsedHrp.ok) return parsedHrp

  const words = decoded.words
  if (words.length < 7 + 104) return { ok: false, error: 'Invoice is too short to carry a timestamp and signature' }

  const timestamp = wordsToInt(words.slice(0, 7))
  if (timestamp == null) return { ok: false, error: 'Invoice timestamp could not be read' }

  const signatureBytes = wordsToBytes(words.slice(-104))
  if (!signatureBytes || signatureBytes.length !== 65) {
    return { ok: false, error: 'Invoice signature field is not 65 bytes' }
  }

  const body = words.slice(7, -104)
  let offset = 0
  let paymentHash: string | null = null
  let description: string | null = null
  let descriptionHash: string | null = null
  let payeeNodeKey: string | null = null
  let features: string | null = null
  let minFinalCltv: number | null = null
  let fallbackAddress: string | null = null
  let routeHintCount = 0
  let expirySeconds = 3600
  const unknownTags: number[] = []
  const warnings: string[] = []

  while (offset < body.length) {
    if (offset + 3 > body.length) return { ok: false, error: 'Invoice has a truncated tagged field' }
    const type = body[offset]
    const length = (body[offset + 1] << 5) | body[offset + 2]
    const start = offset + 3
    const end = start + length
    if (end > body.length) return { ok: false, error: 'Invoice has a tagged field longer than its data' }
    const fieldWords = body.slice(start, end)
    offset = end

    if (type === 0) continue
    const bytes = wordsToBytes(fieldWords)

    switch (type) {
      case 1: {
        if (!bytes || bytes.length !== 32) return { ok: false, error: 'Payment hash field is not 32 bytes' }
        paymentHash = bytesToHex(bytes)
        break
      }
      case 13: {
        if (!bytes) return { ok: false, error: 'Description is not valid UTF-8' }
        description = decodeUtf8(bytes)
        if (description == null) return { ok: false, error: 'Description is not valid UTF-8' }
        break
      }
      case 23: {
        if (!bytes || bytes.length !== 32) return { ok: false, error: 'Description hash field is not 32 bytes' }
        descriptionHash = bytesToHex(bytes)
        break
      }
      case 19: {
        if (!bytes || bytes.length !== 33) return { ok: false, error: 'Payee key field is not 33 bytes' }
        payeeNodeKey = bytesToHex(bytes)
        break
      }
      case 5: {
        if (!bytes) return { ok: false, error: 'Fallback address could not be read' }
        fallbackAddress = bytes.length > 0 ? `${bytes[0]} · ${bytesToHex(bytes.slice(1))}` : null
        break
      }
      case 9: {
        features = bytes ? bytesToHex(bytes) : null
        break
      }
      case 6: {
        const expiry = wordsToInt(fieldWords)
        if (expiry == null) return { ok: false, error: 'Expiry field is too large' }
        expirySeconds = expiry
        break
      }
      case 24: {
        const cltv = wordsToInt(fieldWords)
        if (cltv == null) return { ok: false, error: 'CLTV field is too large' }
        minFinalCltv = cltv
        break
      }
      case 3: {
        routeHintCount += 1
        break
      }
      default:
        unknownTags.push(type)
        break
    }
  }

  if (!paymentHash) warnings.push('No payment hash field — this invoice cannot be paid as written.')
  if (!description && !descriptionHash) warnings.push('No description or description hash on the invoice.')
  if (description && descriptionHash) warnings.push('Invoice carries both a description and a description hash.')

  const expiresAt = timestamp + expirySeconds
  return {
    ok: true,
    invoice: {
      network: parsedHrp.network,
      amountMsat: parsedHrp.amountMsat,
      amountText: parsedHrp.amountText,
      timestamp,
      expirySeconds,
      expiresAt,
      paymentHash,
      description,
      descriptionHash,
      payeeNodeKey,
      features,
      minFinalCltv,
      fallbackAddress,
      routeHintCount,
      signature: bytesToHex(signatureBytes),
      unknownTags,
      warnings,
    },
  }
}

/** Exact sats from a millisecond amount, or null when it is not whole sats. */
export function bolt11AmountSats(amountMsat: number | null): number | null {
  if (amountMsat == null || !Number.isFinite(amountMsat)) return null
  if (amountMsat % 1000 !== 0) return null
  return amountMsat / 1000
}

/** Honest expiry line: a time, not a promise that a node will accept it. */
export function bolt11ExpiryLabel(expiresAt: number, nowSeconds: number): string {
  const delta = expiresAt - nowSeconds
  if (!Number.isFinite(delta)) return 'Expiry could not be read'
  if (delta <= 0) return `Expired ${Math.abs(Math.ceil(delta / 60))} min ago`
  if (delta < 3600) return `Expires in ${Math.ceil(delta / 60)} min`
  if (delta < 86_400) return `Expires in ${Math.ceil(delta / 3600)} h`
  return `Expires in ${Math.ceil(delta / 86_400)} days`
}
