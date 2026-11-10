import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bech32Decode, bytesToHex, wordsToBytes } from './bech32'
import { decodeBolt11 } from './bolt11'

/**
 * BOLT11 payee-key recovery.
 *
 * BOLT11 signs SHA256(hrp || data-without-signature), padding the 5-bit data
 * to a byte boundary. The signature carries a recovery id, so the payee key
 * can be recovered even when the invoice has no `n` field. When `n` is present
 * this compares the recovered key against it; it never calls the result valid
 * without that comparison.
 */

export type Bolt11SignatureStatus = 'valid' | 'invalid' | 'recovered' | 'unreadable'

export interface Bolt11SignatureResult {
  status: Bolt11SignatureStatus
  recoveredKey: string | null
  statedKey: string | null
  note: string
}

/** Pad the final 5-bit group with zero bits, as BOLT11 specifies for signing. */
function wordsToPaddedBytes(words: number[]): Uint8Array {
  let accumulator = 0
  let bits = 0
  const out: number[] = []
  for (const word of words) {
    accumulator = (accumulator << 5) | (word & 31)
    bits += 5
    while (bits >= 8) {
      bits -= 8
      out.push((accumulator >>> bits) & 0xff)
    }
  }
  if (bits > 0) out.push((accumulator << (8 - bits)) & 0xff)
  return Uint8Array.from(out)
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array | null> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return null
  const input = new Uint8Array(bytes.length)
  input.set(bytes)
  try {
    return new Uint8Array(await subtle.digest('SHA-256', input.buffer))
  } catch {
    return null
  }
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a)
  out.set(b, a.length)
  return out
}

export async function verifyBolt11Signature(raw: string): Promise<Bolt11SignatureResult> {
  const decoded = decodeBolt11(raw)
  if (!decoded.ok) {
    return { status: 'unreadable', recoveredKey: null, statedKey: null, note: decoded.error }
  }

  const cleaned = raw
    .trim()
    .replace(/^lightning:/i, '')
    .replace(/\s+/g, '')
  const bech32 = bech32Decode(cleaned, { checksum: true })
  if (!bech32.ok) {
    return { status: 'unreadable', recoveredKey: null, statedKey: decoded.invoice.payeeNodeKey, note: bech32.error }
  }
  if (bech32.words.length < 7 + 104) {
    return {
      status: 'unreadable',
      recoveredKey: null,
      statedKey: decoded.invoice.payeeNodeKey,
      note: 'Invoice is too short to carry a signature.',
    }
  }

  const signatureWords = bech32.words.slice(-104)
  const dataWords = bech32.words.slice(0, -104)
  const signatureBytes = wordsToBytes(signatureWords)
  if (!signatureBytes || signatureBytes.length !== 65) {
    return {
      status: 'unreadable',
      recoveredKey: null,
      statedKey: decoded.invoice.payeeNodeKey,
      note: 'Signature is not a 65-byte compact ECDSA signature.',
    }
  }

  const recovery = signatureBytes[64]
  if (recovery > 3) {
    return {
      status: 'unreadable',
      recoveredKey: null,
      statedKey: decoded.invoice.payeeNodeKey,
      note: `Signature recovery id ${recovery} is outside 0–3.`,
    }
  }

  const message = concat(new TextEncoder().encode(bech32.hrp), wordsToPaddedBytes(dataWords))
  const hash = await sha256(message)
  if (!hash) {
    return {
      status: 'unreadable',
      recoveredKey: null,
      statedKey: decoded.invoice.payeeNodeKey,
      note: 'SHA-256 is not available in this browser.',
    }
  }

  let recoveredKey: string
  try {
    // BOLT11 puts the recovery id after R||S; noble expects it first.
    const recoverable = Uint8Array.from([recovery, ...signatureBytes.slice(0, 64)])
    recoveredKey = bytesToHex(secp256k1.recoverPublicKey(recoverable, hash, { prehash: false }))
  } catch {
    return {
      status: 'unreadable',
      recoveredKey: null,
      statedKey: decoded.invoice.payeeNodeKey,
      note: 'The signature could not recover a public key. It may be edited or malformed.',
    }
  }

  const statedKey = decoded.invoice.payeeNodeKey
  if (!statedKey) {
    return {
      status: 'recovered',
      recoveredKey,
      statedKey: null,
      note: 'No n field in this invoice. The key was recovered from the signature, but there is no stated key to compare it with.',
    }
  }

  if (recoveredKey !== statedKey) {
    return {
      status: 'invalid',
      recoveredKey,
      statedKey,
      note: 'The recovered key does not match the invoice n field. The invoice was edited or signed by another key.',
    }
  }

  return {
    status: 'valid',
    recoveredKey,
    statedKey,
    note: 'The recovered payee key matches the n field in this invoice.',
  }
}
