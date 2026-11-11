import { secp256k1, schnorr } from '@noble/curves/secp256k1.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { bech32Decode, wordsToBytes } from './bech32'
import { bip322ToSpendBytes, type Bip322Check, type Bip322Result } from './bip322'
import {
  bip143Sighash,
  bip322Txid,
  bytesEqual,
  bytesToHex,
  doubleSha256,
  legacySighash,
  parseBip322Tx,
  readU64,
  readVarint,
  readWitness,
  taprootSighash,
  type Bip322Prevout,
  type Bip322Transaction,
} from './bip322Tx'

/**
 * BIP-322 full and proof-of-funds verification.
 *
 * The parser and sighash code are shared with `bip322Tx.ts`. This file supplies
 * a bounded script interpreter: P2PKH, P2SH-P2WPKH, P2WPKH, P2SH/P2WSH standard
 * multisig and P2TR key-path. Arbitrary scripts, taproot script paths, annexes,
 * timelocks and unknown sighash modes are reported as inconclusive instead of
 * being called valid. No chain, UTXO or wallet state is fetched.
 */

type AddressKind = 'P2PKH' | 'P2SH' | 'P2WPKH' | 'P2WSH' | 'P2TR'

interface AddressScript {
  address: string
  type: AddressKind
  network: 'bitcoin' | 'testnet' | 'regtest'
  script: Uint8Array
}

interface Multisig {
  m: number
  n: number
  pubkeys: Uint8Array[]
}

interface FinalizedInput {
  scriptSig: Uint8Array
  witness: Uint8Array[]
}

interface PsbtInput {
  witnessUtxo: { value: number; script: Uint8Array } | null
  nonWitnessUtxo: { txid: string; output: { value: number; script: Uint8Array } } | null
  final: FinalizedInput
}

interface ParsedPsbt {
  tx: Bip322Transaction
  message: Uint8Array | null
  inputs: PsbtInput[]
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const CURVE_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n
const MAX_SIGNATURE_BYTES = 400_000
const MAX_PSBT_BYTES = 400_000

const FULL_LIMITS = [
  'This reader covers P2PKH, P2SH-P2WPKH, P2WPKH, standard P2SH/P2WSH multisig and P2TR key-path scripts; other scripts, taproot script paths and annexes are reported as inconclusive.',
  'A valid full proof shows control of the supplied address key at signing time. It does not prove funds, balance, current ownership or that a payment happened.',
  'Timelocks are not evaluated. The trail reports that locktime and sequence were unchecked rather than claiming they are satisfied.',
  'A proof of funds is incomplete by design: it does not prove the set is complete, that the UTXOs are still unspent, or what they are for. This reader never contacts the chain.',
]

const POF_LIMITS = [
  'This reader verifies each supplied PSBT input cryptographically. It does not know whether those UTXOs exist, are unspent, or belong to the claimed set.',
  'A proof of funds does not prove completeness. There may be more UTXOs, and the signer chose which ones to reveal.',
  'This reader covers P2PKH, P2SH-P2WPKH, P2WPKH, standard P2SH/P2WSH multisig and P2TR key-path scripts. Other scripts are inconclusive.',
  'A valid proof shows control at signing time, not ownership now, payment, balance or purpose. Verify the UTXOs with a node or explorer separately.',
]

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function hash160(bytes: Uint8Array): Uint8Array {
  return Uint8Array.from(ripemd160(sha256(bytes)))
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

function parseAddress(raw: string): { ok: true; address: AddressScript } | { ok: false; error: string } {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Paste the signing address first' }
  if (/^(bc|tb|bcrt)1/i.test(value)) {
    const decoded = bech32Decode(value, { checksum: true, encoding: 'any' })
    if (!decoded.ok) return { ok: false, error: decoded.error }
    if (!decoded.words.length) return { ok: false, error: 'Segwit address has no witness version' }
    const version = decoded.words[0]
    const program = wordsToBytes(decoded.words.slice(1))
    if (!program) return { ok: false, error: 'Witness program is not byte-aligned' }
    const network = decoded.hrp === 'bc' ? 'bitcoin' : decoded.hrp === 'tb' ? 'testnet' : 'regtest'
    if (version === 0 && program.length === 20 && decoded.encoding === 'bech32') {
      return {
        ok: true,
        address: { address: value.toLowerCase(), type: 'P2WPKH', network, script: concat(Uint8Array.from([0x00, 0x14]), program) },
      }
    }
    if (version === 0 && program.length === 32 && decoded.encoding === 'bech32') {
      return {
        ok: true,
        address: { address: value.toLowerCase(), type: 'P2WSH', network, script: concat(Uint8Array.from([0x00, 0x20]), program) },
      }
    }
    if (version === 1 && program.length === 32 && decoded.encoding === 'bech32m') {
      return {
        ok: true,
        address: { address: value.toLowerCase(), type: 'P2TR', network, script: concat(Uint8Array.from([0x51, 0x20]), program) },
      }
    }
    return { ok: false, error: 'Unsupported witness version or address encoding' }
  }

  const decoded = base58Decode(value)
  if (!decoded || decoded.length !== 25) return { ok: false, error: 'Not a Base58Check or bech32 address' }
  const payload = decoded.slice(0, 21)
  if (!bytesEqual(doubleSha256(payload).slice(0, 4), decoded.slice(21))) {
    return { ok: false, error: 'Base58Check checksum failed' }
  }
  const version = payload[0]
  const hash = payload.slice(1)
  const network = version === 0x00 || version === 0x05 ? 'bitcoin' : 'testnet'
  if (version === 0x00 || version === 0x6f) {
    return {
      ok: true,
      address: {
        address: value,
        type: 'P2PKH',
        network,
        script: concat(Uint8Array.from([0x76, 0xa9, 0x14]), hash, Uint8Array.from([0x88, 0xac])),
      },
    }
  }
  if (version === 0x05 || version === 0xc4) {
    return {
      ok: true,
      address: { address: value, type: 'P2SH', network, script: concat(Uint8Array.from([0xa9, 0x14]), hash, Uint8Array.from([0x87])) },
    }
  }
  return { ok: false, error: `Unsupported Base58 version 0x${version.toString(16)}` }
}

function scriptKind(script: Uint8Array): string {
  if (script.length === 25 && script[0] === 0x76 && script[1] === 0xa9 && script[2] === 0x14 && script[23] === 0x88 && script[24] === 0xac) return 'P2PKH'
  if (script.length === 23 && script[0] === 0xa9 && script[1] === 0x14 && script[22] === 0x87) return 'P2SH'
  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) return 'P2WPKH'
  if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) return 'P2WSH'
  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) return 'P2TR'
  return 'custom'
}

function readPushes(script: Uint8Array): Uint8Array[] | null {
  const pushes: Uint8Array[] = []
  let cursor = 0
  while (cursor < script.length) {
    const opcode = script[cursor]
    cursor += 1
    let length = 0
    if (opcode === 0x00) length = 0
    else if (opcode <= 0x4b) length = opcode
    else if (opcode === 0x4c) {
      if (cursor + 1 > script.length) return null
      length = script[cursor]
      cursor += 1
    } else if (opcode === 0x4d) {
      if (cursor + 2 > script.length) return null
      length = script[cursor] | (script[cursor + 1] << 8)
      cursor += 2
    } else {
      return null
    }
    if (cursor + length > script.length) return null
    pushes.push(script.slice(cursor, cursor + length))
    cursor += length
  }
  return pushes
}

function parseMultisig(script: Uint8Array): Multisig | null {
  if (script.length < 3 || script[script.length - 1] !== 0xae) return null
  const mOpcode = script[0]
  if (mOpcode < 0x51 || mOpcode > 0x60) return null
  const m = mOpcode - 0x50
  const pubkeys: Uint8Array[] = []
  let cursor = 1
  while (cursor < script.length - 2) {
    const length = script[cursor]
    if (length !== 33 && length !== 65) return null
    if (cursor + 1 + length > script.length - 2) return null
    pubkeys.push(script.slice(cursor + 1, cursor + 1 + length))
    cursor += 1 + length
  }
  if (cursor !== script.length - 2) return null
  const nOpcode = script[cursor]
  if (nOpcode < 0x51 || nOpcode > 0x60) return null
  const n = nOpcode - 0x50
  if (n !== pubkeys.length || m > n) return null
  return { m, n, pubkeys }
}

function isLowS(compact: Uint8Array): boolean {
  let s = 0n
  for (const byte of compact.slice(32)) s = (s << 8n) | BigInt(byte)
  return s <= CURVE_ORDER / 2n
}

function parseDerSignature(signature: Uint8Array): Uint8Array | null {
  if (signature.length < 2 || signature[signature.length - 1] !== 0x01) return null
  try {
    const compact = secp256k1.Signature.fromBytes(signature.slice(0, -1), 'der').toBytes('compact')
    return isLowS(compact) ? compact : null
  } catch {
    return null
  }
}

function verifyP2pkh(
  script: Uint8Array,
  pushes: Uint8Array[],
  tx: Bip322Transaction,
  index: number,
): { status: 'valid' | 'invalid'; note: string } {
  if (pushes.length !== 2) return { status: 'invalid', note: 'P2PKH needs exactly two scriptSig pushes: signature and public key.' }
  const [signature, pubkey] = pushes
  if (!bytesEqual(hash160(pubkey), script.slice(3, 23))) {
    return { status: 'invalid', note: 'The P2PKH public key does not hash to the address script.' }
  }
  const compact = parseDerSignature(signature)
  const sighash = legacySighash(tx, index, script, 0x01)
  if (!compact || !sighash) return { status: 'invalid', note: 'P2PKH needs a strict low-S DER signature with SIGHASH_ALL.' }
  let valid = false
  try {
    valid = secp256k1.verify(compact, sighash, pubkey, { prehash: false })
  } catch {
    valid = false
  }
  return {
    status: valid ? 'valid' : 'invalid',
    note: valid ? 'P2PKH signature verifies over the legacy sighash.' : 'The P2PKH signature does not verify.',
  }
}

function verifyP2wpkh(
  script: Uint8Array,
  scriptSig: Uint8Array,
  witness: Uint8Array[],
  tx: Bip322Transaction,
  index: number,
  amount: number,
): { status: 'valid' | 'invalid'; note: string } {
  if (scriptSig.length) return { status: 'invalid', note: 'Native P2WPKH must have an empty scriptSig.' }
  if (witness.length !== 2) return { status: 'invalid', note: 'P2WPKH needs exactly two witness items: signature and public key.' }
  const [signature, pubkey] = witness
  if (!bytesEqual(hash160(pubkey), script.slice(2))) {
    return { status: 'invalid', note: 'The P2WPKH public key does not hash to the address script.' }
  }
  const compact = parseDerSignature(signature)
  const scriptCode = concat(Uint8Array.from([0x76, 0xa9, 0x14]), script.slice(2), Uint8Array.from([0x88, 0xac]))
  const sighash = bip143Sighash(tx, index, scriptCode, amount, 0x01)
  if (!compact || !sighash) return { status: 'invalid', note: 'P2WPKH needs a strict low-S DER signature with SIGHASH_ALL.' }
  let valid = false
  try {
    valid = secp256k1.verify(compact, sighash, pubkey, { prehash: false })
  } catch {
    valid = false
  }
  return {
    status: valid ? 'valid' : 'invalid',
    note: valid ? 'P2WPKH signature verifies over the BIP-143 sighash.' : 'The P2WPKH signature does not verify.',
  }
}

function verifyMultisig(
  multisig: Multisig,
  signatures: Uint8Array[],
  tx: Bip322Transaction,
  index: number,
  sighashMode: 'legacy' | 'bip143',
  scriptCode: Uint8Array,
  amount: number,
): { status: 'valid' | 'invalid'; note: string } {
  if (signatures.length !== multisig.m) {
    return { status: 'invalid', note: `This ${multisig.m}-of-${multisig.n} multisig needs exactly ${multisig.m} signatures.` }
  }
  const sighash = sighashMode === 'legacy' ? legacySighash(tx, index, scriptCode, 0x01) : bip143Sighash(tx, index, scriptCode, amount, 0x01)
  if (!sighash) return { status: 'invalid', note: 'The multisig sighash could not be built.' }
  let keyCursor = 0
  for (const signature of signatures) {
    const compact = parseDerSignature(signature)
    if (!compact) return { status: 'invalid', note: 'Every multisig signature must be strict low-S DER with SIGHASH_ALL.' }
    let matched = false
    while (keyCursor < multisig.pubkeys.length) {
      const pubkey = multisig.pubkeys[keyCursor]
      keyCursor += 1
      try {
        if (secp256k1.verify(compact, sighash, pubkey, { prehash: false })) {
          matched = true
          break
        }
      } catch {
        // Try the next key in script order.
      }
    }
    if (!matched) return { status: 'invalid', note: 'A multisig signature does not match any remaining key in script order.' }
  }
  return {
    status: 'valid',
    note: `${multisig.m}-of-${multisig.n} multisig signatures verify over the ${sighashMode === 'legacy' ? 'legacy' : 'BIP-143'} sighash.`,
  }
}

function verifyP2tr(
  script: Uint8Array,
  scriptSig: Uint8Array,
  witness: Uint8Array[],
  tx: Bip322Transaction,
  index: number,
  prevouts: Bip322Prevout[],
): { status: 'valid' | 'invalid' | 'unsupported'; note: string } {
  if (scriptSig.length) return { status: 'invalid', note: 'P2TR key-path spends must have an empty scriptSig.' }
  if (witness.length !== 1) {
    return {
      status: 'unsupported',
      note: 'This P2TR witness has an annex or a script path. Taproot script paths and annexes are not interpreted here.',
    }
  }
  const signature = witness[0]
  if (signature.length !== 64 && !(signature.length === 65 && signature[64] === 0x01)) {
    return { status: 'invalid', note: 'P2TR needs a 64-byte Schnorr signature or 65 bytes with SIGHASH_ALL.' }
  }
  const hashType = signature.length === 65 ? 0x01 : 0x00
  const sighash = taprootSighash(tx, index, prevouts, hashType)
  if (!sighash) return { status: 'invalid', note: 'The taproot sighash could not be built.' }
  let valid = false
  try {
    valid = schnorr.verify(signature.slice(0, 64), sighash, script.slice(2))
  } catch {
    valid = false
  }
  return {
    status: valid ? 'valid' : 'invalid',
    note: valid
      ? `P2TR key-path signature verifies over the BIP-341 sighash (${hashType === 0 ? 'SIGHASH_DEFAULT' : 'SIGHASH_ALL'}).`
      : 'The P2TR key-path signature does not verify.',
  }
}

interface SpendResult {
  status: 'valid' | 'invalid' | 'unsupported'
  note: string
  kind: string
  pubkey: string | null
}

function verifySpend(
  tx: Bip322Transaction,
  index: number,
  spend: FinalizedInput,
  utxo: Bip322Prevout,
  prevouts: Bip322Prevout[],
): SpendResult {
  const kind = scriptKind(utxo.script)
  const { scriptSig, witness } = spend
  if (kind === 'P2PKH') {
    const pushes = readPushes(scriptSig)
    if (!pushes) return { status: 'invalid', note: 'P2PKH scriptSig is not a sequence of pushes.', kind, pubkey: null }
    const result = verifyP2pkh(utxo.script, pushes, tx, index)
    return { ...result, kind, pubkey: pushes[1] ? bytesToHex(pushes[1]) : null }
  }
  if (kind === 'P2WPKH') {
    const result = verifyP2wpkh(utxo.script, scriptSig, witness, tx, index, utxo.value)
    return { ...result, kind, pubkey: witness[1] ? bytesToHex(witness[1]) : null }
  }
  if (kind === 'P2TR') {
    const result = verifyP2tr(utxo.script, scriptSig, witness, tx, index, prevouts)
    return { ...result, kind, pubkey: bytesToHex(utxo.script.slice(2)) }
  }
  if (kind === 'P2WSH') {
    if (scriptSig.length) return { status: 'invalid', note: 'Native P2WSH must have an empty scriptSig.', kind, pubkey: null }
    if (!witness.length) return { status: 'invalid', note: 'P2WSH has no witness stack.', kind, pubkey: null }
    const witnessScript = witness[witness.length - 1]
    if (!bytesEqual(sha256(witnessScript), utxo.script.slice(2))) {
      return { status: 'invalid', note: 'The witness script does not hash to the P2WSH output.', kind, pubkey: null }
    }
    const multisig = parseMultisig(witnessScript)
    if (!multisig) return { status: 'unsupported', note: 'P2WSH is supported only for a standard multisig witness script.', kind, pubkey: null }
    const stack = witness.slice(0, -1)
    if (!stack.length || stack[0].length !== 0) {
      return { status: 'invalid', note: 'P2WSH multisig needs the OP_0 dummy item before the signatures.', kind, pubkey: null }
    }
    const result = verifyMultisig(multisig, stack.slice(1), tx, index, 'bip143', witnessScript, utxo.value)
    return { ...result, kind: `${kind} multisig`, pubkey: bytesToHex(multisig.pubkeys[0]) }
  }
  if (kind === 'P2SH') {
    const pushes = readPushes(scriptSig)
    if (!pushes?.length) return { status: 'invalid', note: 'P2SH needs its redeem script in scriptSig.', kind, pubkey: null }
    const redeemScript = pushes[pushes.length - 1]
    if (!bytesEqual(hash160(redeemScript), utxo.script.slice(2, 22))) {
      return { status: 'invalid', note: 'The redeem script does not hash to the P2SH output.', kind, pubkey: null }
    }
    const redeemKind = scriptKind(redeemScript)
    if (redeemKind === 'P2WPKH') {
      if (pushes.length !== 1) return { status: 'invalid', note: 'P2SH-P2WPKH scriptSig must contain only the redeem script.', kind, pubkey: null }
      const result = verifyP2wpkh(redeemScript, new Uint8Array(), witness, tx, index, utxo.value)
      return { ...result, kind: 'P2SH-P2WPKH', pubkey: witness[1] ? bytesToHex(witness[1]) : null }
    }
    if (redeemKind === 'P2WSH') {
      if (pushes.length !== 1) return { status: 'invalid', note: 'P2SH-P2WSH scriptSig must contain only the redeem script.', kind, pubkey: null }
      if (!witness.length) return { status: 'invalid', note: 'P2SH-P2WSH has no witness stack.', kind: 'P2SH-P2WSH', pubkey: null }
      const witnessScript = witness[witness.length - 1]
      if (!bytesEqual(sha256(witnessScript), redeemScript.slice(2))) {
        return { status: 'invalid', note: 'The witness script does not hash to the P2SH-P2WSH redeem script.', kind: 'P2SH-P2WSH', pubkey: null }
      }
      const multisig = parseMultisig(witnessScript)
      if (!multisig) return { status: 'unsupported', note: 'P2SH-P2WSH is supported only for a standard multisig witness script.', kind: 'P2SH-P2WSH', pubkey: null }
      const stack = witness.slice(0, -1)
      if (!stack.length || stack[0].length !== 0) {
        return { status: 'invalid', note: 'P2SH-P2WSH multisig needs the OP_0 dummy item.', kind: 'P2SH-P2WSH', pubkey: null }
      }
      const result = verifyMultisig(multisig, stack.slice(1), tx, index, 'bip143', witnessScript, utxo.value)
      return { ...result, kind: 'P2SH-P2WSH multisig', pubkey: bytesToHex(multisig.pubkeys[0]) }
    }
    const multisig = parseMultisig(redeemScript)
    if (!multisig) return { status: 'unsupported', note: 'P2SH is supported only for P2SH-P2WPKH, P2SH-P2WSH and standard multisig.', kind, pubkey: null }
    const stack = pushes.slice(0, -1)
    if (!stack.length || stack[0].length !== 0) {
      return { status: 'invalid', note: 'P2SH multisig needs the OP_0 dummy item before the signatures.', kind: 'P2SH multisig', pubkey: null }
    }
    const result = verifyMultisig(multisig, stack.slice(1), tx, index, 'legacy', redeemScript, utxo.value)
    return { ...result, kind: 'P2SH multisig', pubkey: bytesToHex(multisig.pubkeys[0]) }
  }
  return { status: 'unsupported', note: `${kind} scripts are not interpreted by this reader.`, kind, pubkey: null }
}

function check(status: Bip322Check['state'], label: string): Bip322Check {
  return { label, state: status }
}

function structuralChecks(tx: Bip322Transaction): string | null {
  if (tx.version !== 0 && tx.version !== 2) return 'to_sign nVersion must be 0 or 2 in this reader.'
  if (tx.outputs.length !== 1) return 'to_sign must have exactly one output.'
  if (tx.outputs[0].value !== 0) return 'to_sign output value must be zero.'
  if (!bytesEqual(tx.outputs[0].script, Uint8Array.from([0x6a]))) return 'to_sign output script must be OP_RETURN.'
  return null
}

function unreadable(note: string, format: Bip322Result['format'], addressType: string | null, limits: string[]): Bip322Result {
  return {
    status: 'unreadable',
    format,
    addressType,
    recoveredPubkey: null,
    recoveredAddress: null,
    checks: [check('unknown', 'format'), check('unknown', 'script')],
    note,
    limits,
  }
}

export function verifyBip322Full(addressInput: string, message: string, signatureInput: string): Bip322Result {
  const trimmed = signatureInput.trim()
  const prefix = trimmed.slice(0, 3).toLowerCase()
  const format: Bip322Result['format'] = prefix === 'pof' ? 'BIP-322 proof-of-funds' : 'BIP-322 full'
  const limits = prefix === 'pof' ? POF_LIMITS : FULL_LIMITS
  const parsedAddress = parseAddress(addressInput)
  if (!parsedAddress.ok) return unreadable(parsedAddress.error, format, null, limits)
  const address = parsedAddress.address
  if (message.length > 100_000) return unreadable('Message is too long to verify safely.', format, address.type, limits)
  if (prefix !== 'ful' && prefix !== 'pof') return unreadable('Not a BIP-322 full or proof-of-funds signature.', null, address.type, limits)

  let decoded: Uint8Array
  try {
    const binary = atob(trimmed.slice(3).replace(/\s+/g, ''))
    decoded = Uint8Array.from(binary, char => char.charCodeAt(0))
  } catch {
    return unreadable('Signature payload is not valid base64.', format, address.type, limits)
  }
  if (!decoded.length || decoded.length > MAX_SIGNATURE_BYTES) {
    return unreadable('Signature payload is empty or too large.', format, address.type, limits)
  }

  const toSpendTxid = bytesToHex(doubleSha256(bip322ToSpendBytes(message, address.script)).reverse())
  if (prefix === 'ful') {
    const tx = parseBip322Tx(decoded)
    if (!tx) return unreadable('This ful payload is not a complete transaction.', format, address.type, limits)
    if (tx.inputs.length !== 1) {
      return unreadable('The ful format carries exactly one input; use pof for additional proof-of-funds inputs.', format, address.type, limits)
    }
    if (tx.inputs[0].txid !== toSpendTxid || tx.inputs[0].vout !== 0) {
      return unreadable('The to_sign input does not spend the expected to_spend output.', format, address.type, limits)
    }
    const structureError = structuralChecks(tx)
    if (structureError) return unreadable(structureError, format, address.type, limits)
    const prevouts: Bip322Prevout[] = [{ value: 0, script: address.script }]
    const spend = verifySpend(tx, 0, { scriptSig: tx.inputs[0].scriptSig, witness: tx.inputs[0].witness }, prevouts[0], prevouts)
    const checks = [
      check('pass', 'format'),
      check('pass', 'to_spend'),
      check('pass', 'output'),
      check(spend.status === 'unsupported' ? 'unknown' : spend.status === 'valid' ? 'pass' : 'fail', 'script'),
      check('unknown', 'timelock'),
    ]
    if (spend.status === 'unsupported') {
      return { status: 'unreadable', format, addressType: address.type, recoveredPubkey: spend.pubkey, recoveredAddress: null, checks, note: `Inconclusive: ${spend.note}`, limits }
    }
    return {
      status: spend.status === 'valid' ? 'valid' : 'invalid',
      format,
      addressType: address.type,
      recoveredPubkey: spend.pubkey,
      recoveredAddress: spend.status === 'valid' ? address.address : null,
      checks,
      note:
        spend.status === 'valid'
          ? `${spend.note} This proves control of the supplied ${address.type} script for the exact message. Timelock and sequence values were not evaluated. It is not proof of funds or payment.`
          : spend.note,
      limits,
    }
  }

  const psbt = parsePsbt(decoded)
  if (!psbt) return unreadable('This pof payload is not a readable finalized PSBT.', format, address.type, limits)
  if (!psbt.message) return unreadable('The PSBT has no BIP-322 generic signed-message field (0x09).', format, address.type, limits)
  if (!bytesEqual(psbt.message, new TextEncoder().encode(message))) {
    return unreadable('The PSBT signed-message field does not match the supplied message.', format, address.type, limits)
  }
  if (psbt.tx.inputs.length === 0) return unreadable('The PSBT has no inputs.', format, address.type, limits)
  if (psbt.tx.inputs[0].txid !== toSpendTxid || psbt.tx.inputs[0].vout !== 0) {
    return unreadable('The first PSBT input does not spend the expected to_spend output.', format, address.type, limits)
  }
  const structureError = structuralChecks(psbt.tx)
  if (structureError) return unreadable(structureError, format, address.type, limits)

  const prevouts: Bip322Prevout[] = []
  for (let i = 0; i < psbt.tx.inputs.length; i += 1) {
    const resolved = resolvePsbtUtxo(psbt.tx, i, psbt.inputs[i])
    if (!resolved.ok) return unreadable(resolved.error, format, address.type, limits)
    if (i === 0 && (!bytesEqual(resolved.utxo.script, address.script) || resolved.utxo.value !== 0)) {
      return unreadable('The first PSBT UTXO is not the zero-value to_spend output for this address.', format, address.type, limits)
    }
    prevouts.push(resolved.utxo)
  }

  const results = psbt.tx.inputs.map((_, index) =>
    verifySpend(
      psbt.tx,
      index,
      psbt.inputs[index].final,
      prevouts[index],
      prevouts,
    ),
  )
  const unsupported = results.filter(result => result.status === 'unsupported')
  const failed = results.filter(result => result.status === 'invalid')
  const checks = [
    check('pass', 'format'),
    check('pass', 'message field'),
    check('pass', 'to_spend'),
    check(failed.length ? 'fail' : 'pass', 'inputs'),
    check(unsupported.length ? 'unknown' : 'pass', 'scripts'),
    check('unknown', 'utxo state'),
    check('unknown', 'timelock'),
  ]
  const additional = psbt.tx.inputs.length - 1
  if (failed.length) {
    return {
      status: 'invalid',
      format,
      addressType: address.type,
      recoveredPubkey: results[0]?.pubkey ?? null,
      recoveredAddress: null,
      checks,
      note: `At least one PSBT input failed: ${results
        .map((result, index) => (result.status === 'invalid' ? `input ${index} (${result.note})` : null))
        .filter(Boolean)
        .join('; ')}`,
      limits,
    }
  }
  if (unsupported.length) {
    return {
      status: 'unreadable',
      format,
      addressType: address.type,
      recoveredPubkey: results[0]?.pubkey ?? null,
      recoveredAddress: null,
      checks,
      note: `Inconclusive: ${unsupported.length} input script(s) are outside this reader. ${unsupported.map(result => result.note).join(' ')}`,
      limits,
    }
  }
  return {
    status: 'valid',
    format,
    addressType: address.type,
    recoveredPubkey: results[0]?.pubkey ?? null,
    recoveredAddress: address.address,
    checks,
    note: `All ${results.length} PSBT input script(s) verify cryptographically${additional === 0 ? '; no additional proof-of-funds UTXOs were supplied' : `, including ${additional} additional proof-of-funds input(s)`}. This does not prove the UTXOs exist, are unspent, are the complete set, or that a payment happened.`,
    limits,
  }
}

function readMap(bytes: Uint8Array, offset: number): { entries: Array<{ key: Uint8Array; value: Uint8Array }>; next: number } | null {
  const entries: Array<{ key: Uint8Array; value: Uint8Array }> = []
  let cursor = offset
  while (cursor < bytes.length) {
    const key = readByteVectorLocal(bytes, cursor)
    if (!key) return null
    if (!key.value.length) return { entries, next: key.next }
    const value = readByteVectorLocal(bytes, key.next)
    if (!value) return null
    entries.push({ key: key.value, value: value.value })
    cursor = value.next
  }
  return null
}

function readByteVectorLocal(bytes: Uint8Array, offset: number): { value: Uint8Array; next: number } | null {
  const length = readVarint(bytes, offset)
  if (!length) return null
  const start = length.next
  const end = start + length.value
  if (end > bytes.length) return null
  return { value: bytes.slice(start, end), next: end }
}

function parseWitnessUtxo(value: Uint8Array): { value: number; script: Uint8Array } | null {
  const amount = readU64(value, 0)
  if (amount == null) return null
  const script = readByteVectorLocal(value, 8)
  if (!script) return null
  return { value: amount, script: script.value }
}

function parsePsbt(bytes: Uint8Array): ParsedPsbt | null {
  if (bytes.length < 5 || bytes.length > MAX_PSBT_BYTES) return null
  if (![0x70, 0x73, 0x62, 0x74, 0xff].every((byte, index) => bytes[index] === byte)) return null
  const global = readMap(bytes, 5)
  if (!global) return null
  const unsigned = global.entries.find(entry => entry.key.length === 1 && entry.key[0] === 0x00)
  const message = global.entries.find(entry => entry.key.length === 1 && entry.key[0] === 0x09)
  if (!unsigned) return null
  const tx = parseBip322Tx(unsigned.value)
  if (!tx) return null
  let cursor = global.next
  const inputs: PsbtInput[] = []
  for (let i = 0; i < tx.inputs.length; i += 1) {
    const map = readMap(bytes, cursor)
    if (!map) return null
    cursor = map.next
    let witnessUtxo: PsbtInput['witnessUtxo'] = null
    let nonWitnessUtxo: PsbtInput['nonWitnessUtxo'] = null
    let scriptSig: Uint8Array = new Uint8Array()
    let witness: Uint8Array[] = []
    for (const entry of map.entries) {
      if (entry.key.length !== 1) continue
      const type = entry.key[0]
      if (type === 0x00) {
        const previous = parseBip322Tx(entry.value)
        if (!previous || previous.outputs[tx.inputs[i].vout] == null) return null
        nonWitnessUtxo = { txid: bip322Txid(previous), output: previous.outputs[tx.inputs[i].vout] }
      } else if (type === 0x01) {
        witnessUtxo = parseWitnessUtxo(entry.value)
      } else if (type === 0x07) {
        scriptSig = entry.value
      } else if (type === 0x08) {
        const parsed = readWitness(entry.value, 0)
        if (!parsed || parsed.next !== entry.value.length) return null
        witness = parsed.value
      }
    }
    inputs.push({ witnessUtxo, nonWitnessUtxo, final: { scriptSig, witness } })
  }
  for (let i = 0; i < tx.outputs.length; i += 1) {
    const map = readMap(bytes, cursor)
    if (!map) return null
    cursor = map.next
  }
  if (cursor !== bytes.length) return null
  return { tx, message: message?.value ?? null, inputs }
}

function resolvePsbtUtxo(
  tx: Bip322Transaction,
  index: number,
  input: PsbtInput,
): { ok: true; utxo: Bip322Prevout } | { ok: false; error: string } {
  if (!input.witnessUtxo && !input.nonWitnessUtxo) {
    return { ok: false, error: `PSBT input ${index} has neither a witness UTXO nor a non-witness UTXO.` }
  }
  if (input.nonWitnessUtxo && input.nonWitnessUtxo.txid !== tx.inputs[index].txid) {
    return { ok: false, error: `PSBT input ${index} carries a non-witness UTXO for a different transaction.` }
  }
  if (input.witnessUtxo && input.nonWitnessUtxo) {
    if (
      input.witnessUtxo.value !== input.nonWitnessUtxo.output.value ||
      !bytesEqual(input.witnessUtxo.script, input.nonWitnessUtxo.output.script)
    ) {
      return { ok: false, error: `PSBT input ${index} has conflicting witness and non-witness UTXOs.` }
    }
  }
  const selected = input.witnessUtxo ?? input.nonWitnessUtxo?.output
  if (!selected) return { ok: false, error: `PSBT input ${index} has no usable UTXO.` }
  return { ok: true, utxo: selected }
}
