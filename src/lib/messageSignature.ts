import { secp256k1 } from '@noble/curves/secp256k1.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { bech32Decode, wordsToBytes } from './bech32'

/**
 * BIP-137 legacy Bitcoin signed-message verification.
 *
 * The compact 65-byte signature carries a header that identifies the address
 * type and recovery id. Recovering the public key is not enough: the recovered
 * key must hash to the supplied P2PKH / P2SH-P2WPKH / P2WPKH address.
 *
 * This is the legacy `Bitcoin Signed Message:\n` format. It does not verify
 * BIP-322, taproot messages or arbitrary scripts; those are reported as
 * unreadable rather than called valid.
 */

export type MessageSignatureStatus = 'valid' | 'invalid' | 'unreadable'

export interface MessageSignatureResult {
  status: MessageSignatureStatus
  addressType: string | null
  recoveredPubkey: string | null
  recoveredAddress: string | null
  note: string
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const MESSAGE_PREFIX = new TextEncoder().encode('Bitcoin Signed Message:\n')

type AddressKind = 'P2PKH' | 'P2SH' | 'P2WPKH'

interface ParsedAddress {
  address: string
  network: 'bitcoin' | 'testnet' | 'regtest'
  kind: AddressKind
  hash: Uint8Array
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
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

function varint(value: number): Uint8Array {
  if (value < 0xfd) return Uint8Array.from([value])
  if (value <= 0xffff) return Uint8Array.from([0xfd, value & 0xff, value >>> 8])
  return Uint8Array.from([0xfe, value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
}

function doubleSha256(bytes: Uint8Array): Uint8Array {
  return sha256(sha256(bytes))
}

function hash160(bytes: Uint8Array): Uint8Array {
  return Uint8Array.from(ripemd160(sha256(bytes)))
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, index) => byte === b[index])
}

function base58Decode(value: string): Uint8Array | null {
  if (!value || [...value].some(char => !BASE58_ALPHABET.includes(char))) return null
  const bytes: number[] = [0]
  for (const char of value) {
    let carry = BASE58_ALPHABET.indexOf(char)
    for (let i = bytes.length - 1; i >= 0; i -= 1) {
      const next = bytes[i] * 58 + carry
      bytes[i] = next & 0xff
      carry = next >> 8
    }
    while (carry > 0) {
      bytes.unshift(carry & 0xff)
      carry >>= 8
    }
  }
  let leadingZeros = 0
  for (const char of value) {
    if (char !== '1') break
    leadingZeros += 1
  }
  while (bytes.length > 1 && bytes[0] === 0) bytes.shift()
  return Uint8Array.from([...new Array(leadingZeros).fill(0), ...bytes])
}

function parseAddress(raw: string): { ok: true; address: ParsedAddress } | { ok: false; error: string } {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Paste the signing address first' }

  if (/^(bc|tb|bcrt)1/i.test(value)) {
    const decoded = bech32Decode(value, { checksum: true, encoding: 'bech32' })
    if (!decoded.ok) return { ok: false, error: decoded.error }
    if (decoded.words[0] !== 0) return { ok: false, error: 'BIP-137 only covers version-0 P2WPKH addresses, not taproot' }
    const program = decoded.words.slice(1)
    if (program.length !== 20) return { ok: false, error: 'BIP-137 P2WPKH needs a 20-byte witness program' }
    const hash = wordsToBytes(program)
    if (!hash || hash.length !== 20) return { ok: false, error: 'P2WPKH witness program could not be decoded' }
    return {
      ok: true,
      address: {
        address: value.toLowerCase(),
        network: decoded.hrp === 'bc' ? 'bitcoin' : decoded.hrp === 'tb' ? 'testnet' : 'regtest',
        kind: 'P2WPKH',
        hash,
      },
    }
  }

  const decoded = base58Decode(value)
  if (!decoded || decoded.length !== 25) return { ok: false, error: 'Not a Base58Check address' }
  const payload = decoded.slice(0, 21)
  if (!bytesEqual(doubleSha256(payload).slice(0, 4), decoded.slice(21))) {
    return { ok: false, error: 'Base58Check checksum failed' }
  }
  const version = payload[0]
  const hash = payload.slice(1)
  const kind: AddressKind | null =
    version === 0x00 || version === 0x6f ? 'P2PKH' : version === 0x05 || version === 0xc4 ? 'P2SH' : null
  if (!kind) return { ok: false, error: `Unsupported Base58 version 0x${version.toString(16)}` }
  return {
    ok: true,
    address: {
      address: value,
      network: version === 0x00 || version === 0x05 ? 'bitcoin' : 'testnet',
      kind,
      hash,
    },
  }
}

function digest(message: string): Uint8Array {
  const messageBytes = new TextEncoder().encode(message)
  return doubleSha256(
    concat(varint(MESSAGE_PREFIX.length), MESSAGE_PREFIX, varint(messageBytes.length), messageBytes),
  )
}

export function verifyMessageSignature(
  addressInput: string,
  message: string,
  signatureBase64: string,
): MessageSignatureResult {
  const parsed = parseAddress(addressInput)
  if (!parsed.ok) {
    return { status: 'unreadable', addressType: null, recoveredPubkey: null, recoveredAddress: null, note: parsed.error }
  }
  if (!message.length) {
    return { status: 'unreadable', addressType: parsed.address.kind, recoveredPubkey: null, recoveredAddress: null, note: 'Message is empty' }
  }
  if (message.length > 100_000) {
    return { status: 'unreadable', addressType: parsed.address.kind, recoveredPubkey: null, recoveredAddress: null, note: 'Message is too long to verify safely' }
  }

  let compact: Uint8Array
  try {
    const binary = atob(signatureBase64.trim())
    compact = Uint8Array.from(binary, char => char.charCodeAt(0))
  } catch {
    return { status: 'unreadable', addressType: parsed.address.kind, recoveredPubkey: null, recoveredAddress: null, note: 'Signature is not valid base64' }
  }
  if (compact.length !== 65) {
    return { status: 'unreadable', addressType: parsed.address.kind, recoveredPubkey: null, recoveredAddress: null, note: `Compact signature must be 65 bytes, got ${compact.length}` }
  }

  const header = compact[0]
  let kind: AddressKind
  let compressed: boolean
  let recid: number
  if (header >= 27 && header <= 30) {
    kind = 'P2PKH'
    compressed = false
    recid = header - 27
  } else if (header >= 31 && header <= 34) {
    kind = 'P2PKH'
    compressed = true
    recid = header - 31
  } else if (header >= 35 && header <= 38) {
    kind = 'P2SH'
    compressed = true
    recid = header - 35
  } else if (header >= 39 && header <= 42) {
    kind = 'P2WPKH'
    compressed = true
    recid = header - 39
  } else {
    return { status: 'unreadable', addressType: parsed.address.kind, recoveredPubkey: null, recoveredAddress: null, note: `Header byte ${header} is outside BIP-137's 27–42 range` }
  }

  if (kind !== parsed.address.kind) {
    return {
      status: 'invalid',
      addressType: parsed.address.kind,
      recoveredPubkey: null,
      recoveredAddress: null,
      note: `Signature header says ${kind}, but the address is ${parsed.address.kind}`,
    }
  }

  let recovered: Uint8Array
  try {
    let r = 0n
    let s = 0n
    for (const byte of compact.slice(1, 33)) r = (r << 8n) | BigInt(byte)
    for (const byte of compact.slice(33)) s = (s << 8n) | BigInt(byte)
    recovered = new secp256k1.Signature(r, s, recid).recoverPublicKey(digest(message)).toBytes(compressed)
  } catch {
    return {
      status: 'invalid',
      addressType: parsed.address.kind,
      recoveredPubkey: null,
      recoveredAddress: null,
      note: 'No public key could be recovered from this signature and message',
    }
  }

  const pubkeyHash = hash160(recovered)
  let matches = false
  if (parsed.address.kind === 'P2PKH') {
    matches = bytesEqual(pubkeyHash, parsed.address.hash)
  } else if (parsed.address.kind === 'P2WPKH') {
    matches = bytesEqual(pubkeyHash, parsed.address.hash)
  } else {
    const redeem = concat(Uint8Array.from([0x00, 0x14]), pubkeyHash)
    matches = bytesEqual(hash160(redeem), parsed.address.hash)
  }

  const recoveredPubkey = hex(recovered)
  return {
    status: matches ? 'valid' : 'invalid',
    addressType: parsed.address.kind,
    recoveredPubkey,
    recoveredAddress: matches ? parsed.address.address : null,
    note: matches
      ? `Recovered the ${compressed ? 'compressed' : 'uncompressed'} public key and matched it to the ${parsed.address.kind} address. This proves control of that key for this exact message; it is not proof of funds or a current balance.`
      : `The recovered key hashes to ${hex(pubkeyHash).slice(0, 16)}…, which does not match the supplied ${parsed.address.kind} address.`,
  }
}
