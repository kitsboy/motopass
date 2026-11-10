import { secp256k1, schnorr } from '@noble/curves/secp256k1.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { bech32Decode, wordsToBytes } from './bech32'

/**
 * BIP-322 "simple" signed-message verification.
 *
 * BIP-322 signs a virtual transaction that spends a zero-value output paying
 * the address's scriptPubKey. A simple proof carries only the witness stack,
 * so it is limited to native segwit addresses. This reader verifies the two
 * cases a single key can satisfy without a script interpreter:
 *
 * - P2WPKH: [DER signature + SIGHASH_ALL, compressed public key]
 * - P2TR:   [64-byte SIGHASH_DEFAULT Schnorr signature] (or 65-byte ALL)
 *
 * Full (`ful`), proof-of-funds (`pof`) and P2WSH/multisig proofs need a
 * transaction or script interpreter and are reported as unsupported rather
 * than guessed at.
 */

export type Bip322Status = 'valid' | 'invalid' | 'unreadable'

export interface Bip322Check {
  label: string
  state: 'pass' | 'fail' | 'unknown'
}

export interface Bip322Result {
  status: Bip322Status
  format: 'BIP-322 simple' | null
  addressType: 'P2WPKH' | 'P2TR' | null
  recoveredPubkey: string | null
  recoveredAddress: string | null
  checks: Bip322Check[]
  note: string
  limits: string[]
}

interface NativeAddress {
  address: string
  type: 'P2WPKH' | 'P2TR'
  network: 'bitcoin' | 'testnet' | 'regtest'
  program: Uint8Array
  script: Uint8Array
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

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, index) => byte === b[index])
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function reverse(bytes: Uint8Array): Uint8Array {
  return Uint8Array.from(bytes).reverse()
}

function u32le(value: number): Uint8Array {
  return Uint8Array.from([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
}

function u64le(value: number): Uint8Array {
  const out = new Uint8Array(8)
  let remaining = BigInt(value)
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number(remaining & 0xffn)
    remaining >>= 8n
  }
  return out
}

function varint(value: number): Uint8Array {
  if (value < 0xfd) return Uint8Array.from([value])
  if (value <= 0xffff) return Uint8Array.from([0xfd, value & 0xff, value >>> 8])
  return Uint8Array.from([0xfe, value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
}

function readVarint(bytes: Uint8Array, offset: number): { value: number; next: number } | null {
  if (offset >= bytes.length) return null
  const first = bytes[offset]
  if (first < 0xfd) return { value: first, next: offset + 1 }
  const length = first === 0xfd ? 2 : first === 0xfe ? 4 : 8
  if (offset + 1 + length > bytes.length) return null
  let value = 0
  for (let i = 0; i < length; i += 1) value += bytes[offset + 1 + i] * 2 ** (8 * i)
  if (!Number.isSafeInteger(value)) return null
  return { value, next: offset + 1 + length }
}

function doubleSha256(bytes: Uint8Array): Uint8Array {
  return sha256(sha256(bytes))
}

function hash160(bytes: Uint8Array): Uint8Array {
  return Uint8Array.from(ripemd160(sha256(bytes)))
}

function taggedHash(tag: string, message: Uint8Array): Uint8Array {
  const tagHash = sha256(new TextEncoder().encode(tag))
  return sha256(concat(tagHash, tagHash, message))
}

function parseNativeAddress(raw: string): { ok: true; address: NativeAddress } | { ok: false; error: string } {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Paste the signing address first' }
  if (!/^(bc|tb|bcrt)1/i.test(value)) {
    return { ok: false, error: 'BIP-322 simple proofs only cover native bc1/tb1/bcrt1 addresses in this reader' }
  }

  const decoded = bech32Decode(value, { checksum: true, encoding: 'any' })
  if (!decoded.ok) return { ok: false, error: decoded.error }
  if (decoded.words.length < 1) return { ok: false, error: 'Segwit address has no witness version' }
  const version = decoded.words[0]
  const program = wordsToBytes(decoded.words.slice(1))
  if (!program) return { ok: false, error: 'Witness program is not byte-aligned' }

  const network = decoded.hrp === 'bc' ? 'bitcoin' : decoded.hrp === 'tb' ? 'testnet' : 'regtest'
  if (version === 0 && program.length === 20) {
    if (decoded.encoding !== 'bech32') return { ok: false, error: 'P2WPKH must use bech32, not bech32m' }
    return {
      ok: true,
      address: {
        address: value.toLowerCase(),
        type: 'P2WPKH',
        network,
        program,
        script: concat(Uint8Array.from([0x00, 0x14]), program),
      },
    }
  }
  if (version === 1 && program.length === 32) {
    if (decoded.encoding !== 'bech32m') return { ok: false, error: 'P2TR must use bech32m, not bech32' }
    return {
      ok: true,
      address: {
        address: value.toLowerCase(),
        type: 'P2TR',
        network,
        program,
        script: concat(Uint8Array.from([0x51, 0x20]), program),
      },
    }
  }
  if (version === 0) return { ok: false, error: 'P2WSH simple proofs are not supported by this reader' }
  return { ok: false, error: `Witness version ${version} is not supported by this reader` }
}

/** BIP-322's BIP340-tagged message hash, with no length prefix. */
export function bip322MessageHash(message: string): Uint8Array {
  return taggedHash('BIP0322-signed-message', new TextEncoder().encode(message))
}

/**
 * Serialize the unsigned virtual to_spend transaction. Exported so tests can
 * check the published transaction-hash vectors.
 */
export function bip322ToSpendBytes(message: string, script: Uint8Array): Uint8Array {
  const messageHash = bip322MessageHash(message)
  return concat(
    u32le(0),
    varint(1),
    new Uint8Array(32),
    u32le(0xffffffff),
    varint(34),
    Uint8Array.from([0x00, 0x20]),
    messageHash,
    u32le(0),
    varint(1),
    u64le(0),
    varint(script.length),
    script,
    u32le(0),
  )
}

function toSpendDigest(message: string, script: Uint8Array): Uint8Array {
  return doubleSha256(bip322ToSpendBytes(message, script))
}

function p2wpkhSighash(message: string, program: Uint8Array, hashType: number): Uint8Array {
  const toSpend = toSpendDigest(message, concat(Uint8Array.from([0x00, 0x14]), program))
  const outpoint = concat(toSpend, u32le(0))
  const output = concat(u64le(0), varint(1), Uint8Array.from([0x6a]))
  const scriptCode = concat(Uint8Array.from([0x76, 0xa9, 0x14]), program, Uint8Array.from([0x88, 0xac]))
  const preimage = concat(
    u32le(0),
    doubleSha256(outpoint),
    doubleSha256(u32le(0)),
    outpoint,
    varint(scriptCode.length),
    scriptCode,
    u64le(0),
    u32le(0),
    doubleSha256(output),
    u32le(0),
    u32le(hashType),
  )
  return doubleSha256(preimage)
}

function p2trSighash(message: string, program: Uint8Array, hashType: number): Uint8Array {
  const script = concat(Uint8Array.from([0x51, 0x20]), program)
  const toSpend = toSpendDigest(message, script)
  const outpoint = concat(toSpend, u32le(0))
  const output = concat(u64le(0), varint(1), Uint8Array.from([0x6a]))
  const msg = concat(
    Uint8Array.from([0x00, hashType]),
    u32le(0),
    u32le(0),
    sha256(outpoint),
    sha256(u64le(0)),
    sha256(concat(varint(script.length), script)),
    sha256(u32le(0)),
    sha256(output),
    Uint8Array.from([0x00]),
    u32le(0),
  )
  return taggedHash('TapSighash', msg)
}

function decodeBase64(value: string): Uint8Array | null {
  try {
    const binary = atob(value.replace(/\s+/g, ''))
    return Uint8Array.from(binary, char => char.charCodeAt(0))
  } catch {
    return null
  }
}

function readWitnessStack(bytes: Uint8Array): Uint8Array[] | null {
  const count = readVarint(bytes, 0)
  if (!count || count.value > 16) return null
  let cursor = count.next
  const items: Uint8Array[] = []
  for (let i = 0; i < count.value; i += 1) {
    const length = readVarint(bytes, cursor)
    if (!length) return null
    cursor = length.next
    const end = cursor + length.value
    if (end > bytes.length) return null
    items.push(bytes.slice(cursor, end))
    cursor = end
  }
  return cursor === bytes.length ? items : null
}

function derToCompact(der: Uint8Array): Uint8Array | null {
  try {
    return secp256k1.Signature.fromBytes(der, 'der').toBytes('compact')
  } catch {
    return null
  }
}

const LIMITS = [
  'A BIP-322 simple proof covers P2WPKH and single-key P2TR only; P2WSH, multisig and full/proof-of-funds proofs are not verified here.',
  'This proves control of the address key at signing time. It does not prove funds, balance, current ownership or that a payment happened.',
  'The exact message matters. Whitespace, Unicode normalisation or a different line ending changes the BIP340 message hash.',
  'A signature can be replayed wherever the same message and address are accepted; this card does not check the relying party or context.',
]

function invalid(note: string, addressType: NativeAddress['type'] | null, checks: Bip322Check[]): Bip322Result {
  return {
    status: 'invalid',
    format: 'BIP-322 simple',
    addressType,
    recoveredPubkey: null,
    recoveredAddress: null,
    checks,
    note,
    limits: LIMITS,
  }
}

function unreadable(note: string, addressType: NativeAddress['type'] | null = null): Bip322Result {
  return {
    status: 'unreadable',
    format: null,
    addressType,
    recoveredPubkey: null,
    recoveredAddress: null,
    checks: [],
    note,
    limits: LIMITS,
  }
}

export function verifyBip322Simple(addressInput: string, message: string, signatureInput: string): Bip322Result {
  const parsed = parseNativeAddress(addressInput)
  if (!parsed.ok) return unreadable(parsed.error)
  const address = parsed.address

  if (message.length > 100_000) return unreadable('Message is too long to verify safely', address.type)

  const trimmed = signatureInput.trim()
  if (!trimmed) return unreadable('Paste a BIP-322 signature first', address.type)

  const prefix = trimmed.slice(0, 3).toLowerCase()
  if (prefix === 'ful' || prefix === 'pof') {
    return unreadable(
      `BIP-322 ${prefix === 'ful' ? 'full' : 'proof-of-funds'} signatures need a transaction or PSBT verifier and are not supported here`,
      address.type,
    )
  }
  const payload = prefix === 'smp' ? trimmed.slice(3) : trimmed
  const decoded = decodeBase64(payload)
  if (!decoded) return unreadable('Signature is not valid base64', address.type)

  // A 65-byte compact BIP-137 signature is not a witness stack. If the caller
  // has not supplied an smp prefix, leave it to the BIP-137 verifier.
  if (prefix !== 'smp' && decoded.length === 65) {
    return unreadable('Not a BIP-322 simple witness stack; try the BIP-137 verifier instead', address.type)
  }

  const witness = readWitnessStack(decoded)
  if (!witness) return unreadable('Witness stack is malformed or too long', address.type)

  if (address.type === 'P2WPKH') {
    if (witness.length !== 2) {
      return unreadable('P2WPKH needs exactly two witness items: signature and public key', address.type)
    }
    const [signature, pubkey] = witness
    if (signature.length < 9 || signature[signature.length - 1] !== 0x01) {
      return unreadable('P2WPKH requires a DER signature with SIGHASH_ALL', address.type)
    }
    if (pubkey.length !== 33) return unreadable('P2WPKH public key must be 33-byte compressed', address.type)
    if (!bytesEqual(hash160(pubkey), address.program)) {
      return invalid(
        'The witness public key does not hash to the supplied P2WPKH address.',
        address.type,
        [
          { label: 'format', state: 'pass' },
          { label: 'address match', state: 'fail' },
          { label: 'signature', state: 'unknown' },
        ],
      )
    }
    const compact = derToCompact(signature.slice(0, -1))
    if (!compact) {
      return unreadable('Signature is not strict DER', address.type)
    }
    const sighash = p2wpkhSighash(message, address.program, 0x01)
    let valid = false
    try {
      valid = secp256k1.verify(compact, sighash, pubkey, { prehash: false })
    } catch {
      valid = false
    }
    return {
      status: valid ? 'valid' : 'invalid',
      format: 'BIP-322 simple',
      addressType: address.type,
      recoveredPubkey: bytesToHex(pubkey),
      recoveredAddress: valid ? address.address : null,
      checks: [
        { label: 'format', state: 'pass' },
        { label: 'address match', state: 'pass' },
        { label: 'signature', state: valid ? 'pass' : 'fail' },
        { label: 'replay context', state: 'unknown' },
      ],
      note: valid
        ? 'The BIP-322 P2WPKH signature verifies over the BIP-143 virtual-transaction sighash. It proves the address key signed this exact message, not that funds exist or a payment occurred.'
        : 'The BIP-322 P2WPKH signature does not verify for this address and message.',
      limits: LIMITS,
    }
  }

  if (witness.length !== 1) {
    return unreadable('P2TR key-path proofs need exactly one witness item', address.type)
  }
  const signature = witness[0]
  if (signature.length !== 64 && !(signature.length === 65 && signature[64] === 0x01)) {
    return unreadable('P2TR needs a 64-byte Schnorr signature (or 65 bytes with SIGHASH_ALL)', address.type)
  }
  const hashType = signature.length === 65 ? 0x01 : 0x00
  const sighash = p2trSighash(message, address.program, hashType)
  let valid = false
  try {
    valid = schnorr.verify(signature.slice(0, 64), sighash, address.program)
  } catch {
    valid = false
  }
  return {
    status: valid ? 'valid' : 'invalid',
    format: 'BIP-322 simple',
    addressType: address.type,
    recoveredPubkey: bytesToHex(address.program),
    recoveredAddress: valid ? address.address : null,
    checks: [
      { label: 'format', state: 'pass' },
      { label: 'output key', state: 'pass' },
      { label: 'signature', state: valid ? 'pass' : 'fail' },
      { label: 'replay context', state: 'unknown' },
    ],
    note: valid
      ? `The BIP-322 P2TR key-path signature verifies over the BIP-341 sighash (${hashType === 0 ? 'SIGHASH_DEFAULT' : 'SIGHASH_ALL'}). It proves the output key signed this exact message, not that funds exist or a payment occurred.`
      : 'The BIP-322 P2TR signature does not verify for this address and message.',
    limits: LIMITS,
  }
}

/** Published BIP-322 vector helper: display-order txid of to_spend. */
export function bip322ToSpendTxid(message: string, addressInput: string): string | null {
  const parsed = parseNativeAddress(addressInput)
  if (!parsed.ok) return null
  return bytesToHex(reverse(toSpendDigest(message, parsed.address.script)))
}
