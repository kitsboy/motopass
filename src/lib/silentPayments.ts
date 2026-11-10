import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bech32Decode, bech32Encode, bytesToHex, bytesToWords, wordsToBytes } from './bech32'

/**
 * BIP-352 Silent Payments address reader and sender-side output derivation.
 *
 * A silent payment address is a reusable `sp1…` / `tsp1…` bech32m string that
 * commits to a scan key and a spend key. The sender derives a one-time P2TR
 * output from the sum of its input keys, the smallest outpoint and the
 * receiver's scan key; the receiver scans for the same tweak with its scan
 * private key. Nothing here scans the chain or broadcasts.
 */

const CURVE_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

export interface SilentPaymentAddress {
  address: string
  network: 'bitcoin' | 'testnet'
  scanPubkey: string
  spendPubkey: string
  version: number
}

export type SilentPaymentAddressResult =
  | { ok: true; address: SilentPaymentAddress }
  | { ok: false; error: string }

export type SilentPaymentOutputResult =
  | {
      ok: true
      xOnlyPubkey: string
      scriptPubKey: string
      address: string
      inputHash: string
    }
  | { ok: false; error: string }

function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.trim().replace(/^0x/i, '')
  if (!/^[0-9a-f]+$/i.test(clean) || clean.length % 2 !== 0) return null
  return Uint8Array.from(clean.match(/.{2}/g)?.map(byte => Number.parseInt(byte, 16)) ?? [])
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let value = 0n
  for (const byte of bytes) value = (value << 8n) | BigInt(byte)
  return value
}

function ser32(value: number): Uint8Array {
  return Uint8Array.from([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ])
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
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

async function taggedHash(tag: string, message: Uint8Array): Promise<Uint8Array | null> {
  const tagHash = await sha256(new TextEncoder().encode(tag))
  if (!tagHash) return null
  return sha256(concat(tagHash, tagHash, message))
}

function compressedPoint(hex: string): InstanceType<typeof secp256k1.Point> | null {
  try {
    return secp256k1.Point.fromHex(hex)
  } catch {
    return null
  }
}

/** Decode a version-0 silent payment address and validate both public keys. */
export function decodeSilentPaymentAddress(raw: string): SilentPaymentAddressResult {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Paste a silent payment address first' }
  if (value.length > 1023) return { ok: false, error: 'Silent payment address is too long' }

  const decoded = bech32Decode(value, { checksum: true, encoding: 'bech32m' })
  if (!decoded.ok) return { ok: false, error: decoded.error }
  if (decoded.hrp !== 'sp' && decoded.hrp !== 'tsp') {
    return { ok: false, error: 'Silent payment addresses start sp1 (mainnet) or tsp1 (testnet)' }
  }
  if (decoded.words.length < 1) return { ok: false, error: 'Address has no version word' }
  const version = decoded.words[0]
  if (version !== 0) return { ok: false, error: `Silent payment version ${version} is not supported` }

  const payload = wordsToBytes(decoded.words.slice(1))
  if (!payload || payload.length !== 66) {
    return { ok: false, error: 'Version 0 must carry exactly 66 bytes of scan and spend keys' }
  }

  const scanPubkey = bytesToHex(payload.slice(0, 33))
  const spendPubkey = bytesToHex(payload.slice(33))
  if (!compressedPoint(scanPubkey)) return { ok: false, error: 'Scan key is not a valid compressed point' }
  if (!compressedPoint(spendPubkey)) return { ok: false, error: 'Spend key is not a valid compressed point' }

  return {
    ok: true,
    address: {
      address: value.toLowerCase(),
      network: decoded.hrp === 'sp' ? 'bitcoin' : 'testnet',
      scanPubkey,
      spendPubkey,
      version,
    },
  }
}

export interface SilentPaymentInput {
  address: string
  /** Hex private key for the only input, or the sum of input private keys. */
  inputPrivateKey: string
  /** Outpoint of the lexicographically smallest input. */
  txid: string
  vout: number
  /** Output index for multiple payments to the same address (default 0). */
  k?: number
}

/**
 * Sender side of BIP-352: derive one P2TR output.
 *
 * This deliberately takes one summed input key. A wallet must sum every
 * eligible P2WPKH, P2SH-P2WPKH, P2PKH and key-path P2TR input before calling,
 * and must negate taproot keys whose point has odd Y.
 */
export async function deriveSilentPaymentOutput(input: SilentPaymentInput): Promise<SilentPaymentOutputResult> {
  const decoded = decodeSilentPaymentAddress(input.address)
  if (!decoded.ok) return decoded

  const secret = hexToBytes(input.inputPrivateKey)
  if (!secret || secret.length !== 32) return { ok: false, error: 'Input private key must be 32-byte hex' }
  const secretInt = bytesToBigInt(secret)
  if (secretInt <= 0n || secretInt >= CURVE_ORDER) {
    return { ok: false, error: 'Input private key is outside the secp256k1 scalar range' }
  }
  if (!/^[0-9a-f]{64}$/i.test(input.txid.trim())) return { ok: false, error: 'Outpoint txid must be 64 hex characters' }
  if (!Number.isSafeInteger(input.vout) || input.vout < 0 || input.vout > 0xffffffff) {
    return { ok: false, error: 'Outpoint vout must be a uint32' }
  }
  const k = input.k ?? 0
  if (!Number.isSafeInteger(k) || k < 0 || k > 0xffffffff) return { ok: false, error: 'Output index k must be a uint32' }

  const inputPublic = secp256k1.getPublicKey(secret, true)
  const txidLittle = Uint8Array.from(
    input.txid
      .trim()
      .toLowerCase()
      .match(/.{2}/g)
      ?.map(byte => Number.parseInt(byte, 16))
      .reverse() ?? [],
  )
  const outpoint = concat(txidLittle, ser32(input.vout))
  const inputHash = await taggedHash('BIP0352/Inputs', concat(outpoint, inputPublic))
  if (!inputHash) return { ok: false, error: 'SHA-256 is not available in this browser' }
  const inputHashInt = bytesToBigInt(inputHash)
  if (inputHashInt === 0n || inputHashInt >= CURVE_ORDER) {
    return { ok: false, error: 'BIP-352 input hash is not a valid scalar' }
  }

  const scan = compressedPoint(decoded.address.scanPubkey)
  const spend = compressedPoint(decoded.address.spendPubkey)
  if (!scan || !spend) return { ok: false, error: 'Silent payment address keys are invalid' }

  const sharedPoint = scan.multiply(inputHashInt).multiply(secretInt)
  const sharedSecret = sharedPoint.toBytes(true)
  const t = await taggedHash('BIP0352/SharedSecret', concat(sharedSecret, ser32(k)))
  if (!t) return { ok: false, error: 'SHA-256 is not available in this browser' }
  const tInt = bytesToBigInt(t)
  if (tInt === 0n || tInt >= CURVE_ORDER) return { ok: false, error: 'BIP-352 shared-secret tweak is not a valid scalar' }

  const output = spend.add(secp256k1.Point.BASE.multiply(tInt))
  const xOnly = output.toBytes(true).slice(1)
  const address = bech32Encode(
    decoded.address.network === 'bitcoin' ? 'bc' : 'tb',
    [1, ...bytesToWords(xOnly)],
    'bech32m',
  )

  return {
    ok: true,
    xOnlyPubkey: bytesToHex(xOnly),
    scriptPubKey: `5120${bytesToHex(xOnly)}`,
    address,
    inputHash: bytesToHex(inputHash),
  }
}
