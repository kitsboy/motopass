import { secp256k1, schnorr } from '@noble/curves/secp256k1.js'
import { ripemd160 } from '@noble/hashes/legacy.js'

const CURVE_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

/**
 * PSBT signature verification for the input types this reader can prove.
 *
 * ECDSA: P2PKH and P2SH multisig (legacy sighash); P2WPKH, P2WSH multisig and
 * P2SH-P2WSH/P2SH-P2WPKH (BIP-143). P2SH script hashes are checked before a
 * signature is called valid.
 * Schnorr: P2TR key-path and BIP-342 script-path. Script-path checks require
 * the tap leaf, a valid control block and a complete witness UTXO set.
 *
 * Anything else is reported as unsupported instead of being called valid.
 * This verifies the cryptographic signature against the transaction. It does
 * not sign or broadcast.
 */

export type PsbtSignatureStatus = 'valid' | 'invalid' | 'unsupported'

export interface PsbtSignatureCheck {
  input: number
  scheme: 'ecdsa' | 'schnorr'
  pubkey: string
  status: PsbtSignatureStatus
  note: string
}

export interface PsbtVerifyOutput {
  amountSats: number
  script: Uint8Array
}

export interface PsbtVerifyTx {
  version: number
  locktime: number
  inputs: Array<{ txid: string; vout: number; sequence: number }>
  outputs: PsbtVerifyOutput[]
}

export interface PsbtVerifyTapSignature {
  xonly: Uint8Array
  signature: Uint8Array
  /** Present for a script-path signature (key type 0x13 with a 32-byte leaf hash). */
  leafHash: Uint8Array | null
}

export interface PsbtVerifyInput {
  witnessUtxo: number | null
  script: Uint8Array | null
  redeemScript: Uint8Array | null
  witnessScript: Uint8Array | null
  partialSigs: Array<{ pubkey: Uint8Array; signature: Uint8Array }>
  tapSigs: PsbtVerifyTapSignature[]
  /** Raw tap_leaf_script values: control block followed by the leaf script. */
  tapLeafValues: Uint8Array[]
}

interface Multisig {
  m: number
  n: number
  pubkeys: Uint8Array[]
}

interface EcdsaPlan {
  scriptCode: Uint8Array
  sighash: 'legacy' | 'bip143'
  label: string
  allowedPubkeys: Uint8Array[] | null
  multisig: Multisig | null
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

function hexToBytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g)?.map(byte => Number.parseInt(byte, 16)) ?? [])
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, index) => byte === b[index])
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let value = 0n
  for (const byte of bytes) value = (value << 8n) | BigInt(byte)
  return value
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

async function hash160(bytes: Uint8Array): Promise<Uint8Array | null> {
  const first = await sha256(bytes)
  return first ? Uint8Array.from(ripemd160(first)) : null
}

async function doubleSha256(bytes: Uint8Array): Promise<Uint8Array | null> {
  const first = await sha256(bytes)
  return first ? sha256(first) : null
}

async function taggedHash(tag: string, message: Uint8Array): Promise<Uint8Array | null> {
  const tagHash = await sha256(new TextEncoder().encode(tag))
  if (!tagHash) return null
  return sha256(concat(tagHash, tagHash, message))
}

function outpoint(txid: string, vout: number): Uint8Array {
  const little = Uint8Array.from(hexToBytes(txid).slice().reverse())
  return concat(little, u32le(vout))
}

function serializeOutput(output: PsbtVerifyOutput): Uint8Array {
  return concat(u64le(output.amountSats), varint(output.script.length), output.script)
}

function scriptKind(script: Uint8Array): string {
  if (script.length === 25 && script[0] === 0x76 && script[1] === 0xa9 && script[2] === 0x14 && script[23] === 0x88 && script[24] === 0xac) return 'P2PKH'
  if (script.length === 23 && script[0] === 0xa9 && script[1] === 0x14 && script[22] === 0x87) return 'P2SH'
  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) return 'P2WPKH'
  if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) return 'P2WSH'
  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) return 'P2TR'
  return 'custom'
}

function p2wpkhScript(script: Uint8Array): Uint8Array {
  return concat(Uint8Array.from([0x76, 0xa9, 0x14]), script.slice(2), Uint8Array.from([0x88, 0xac]))
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

async function p2shMatches(script: Uint8Array, redeemScript: Uint8Array): Promise<boolean> {
  const hash = await hash160(redeemScript)
  return Boolean(hash && bytesEqual(script.slice(2, 22), hash))
}

async function p2wshMatches(script: Uint8Array, witnessScript: Uint8Array): Promise<boolean> {
  const hash = await sha256(witnessScript)
  return Boolean(hash && bytesEqual(script.slice(2), hash))
}

async function buildEcdsaPlan(input: PsbtVerifyInput, kind: string): Promise<EcdsaPlan | string> {
  if (!input.script) return 'No witness UTXO script is available.'
  if (kind === 'P2PKH') {
    return { scriptCode: input.script, sighash: 'legacy', label: 'P2PKH', allowedPubkeys: null, multisig: null }
  }
  if (kind === 'P2WPKH') {
    return { scriptCode: p2wpkhScript(input.script), sighash: 'bip143', label: 'P2WPKH', allowedPubkeys: null, multisig: null }
  }
  if (kind === 'P2WSH') {
    if (!input.witnessScript) return 'P2WSH needs its witness script to build the sighash.'
    if (!(await p2wshMatches(input.script, input.witnessScript))) return 'The witness script does not match the P2WSH output.'
    const multisig = parseMultisig(input.witnessScript)
    return {
      scriptCode: input.witnessScript,
      sighash: 'bip143',
      label: multisig ? `P2WSH multisig ${multisig.m}-of-${multisig.n}` : 'P2WSH',
      allowedPubkeys: multisig?.pubkeys ?? null,
      multisig,
    }
  }
  if (kind === 'P2SH') {
    if (!input.redeemScript) return 'P2SH needs its redeem script; without it the script hash cannot be checked.'
    if (!(await p2shMatches(input.script, input.redeemScript))) return 'The redeem script does not hash to the P2SH output.'
    const redeemKind = scriptKind(input.redeemScript)
    if (redeemKind === 'P2WPKH') {
      return { scriptCode: p2wpkhScript(input.redeemScript), sighash: 'bip143', label: 'P2SH-P2WPKH', allowedPubkeys: null, multisig: null }
    }
    if (redeemKind === 'P2WSH') {
      if (!input.witnessScript) return 'P2SH-P2WSH needs its witness script.'
      if (!(await p2wshMatches(input.redeemScript, input.witnessScript))) return 'The witness script does not match the P2SH-P2WSH redeem script.'
      const multisig = parseMultisig(input.witnessScript)
      return {
        scriptCode: input.witnessScript,
        sighash: 'bip143',
        label: multisig ? `P2SH-P2WSH multisig ${multisig.m}-of-${multisig.n}` : 'P2SH-P2WSH',
        allowedPubkeys: multisig?.pubkeys ?? null,
        multisig,
      }
    }
    const multisig = parseMultisig(input.redeemScript)
    if (!multisig) return 'P2SH ECDSA verification is limited to a standard multisig redeem script.'
    return {
      scriptCode: input.redeemScript,
      sighash: 'legacy',
      label: `P2SH multisig ${multisig.m}-of-${multisig.n}`,
      allowedPubkeys: multisig.pubkeys,
      multisig,
    }
  }
  return `ECDSA verification for ${kind} is not implemented.`
}

async function bip143Sighash(
  tx: PsbtVerifyTx,
  inputIndex: number,
  scriptCode: Uint8Array,
  amountSats: number,
  hashType: number,
): Promise<Uint8Array | null> {
  const hashPrevouts = await doubleSha256(concat(...tx.inputs.map(input => outpoint(input.txid, input.vout))))
  if (!hashPrevouts) return null
  const hashSequence = await doubleSha256(concat(...tx.inputs.map(input => u32le(input.sequence))))
  if (!hashSequence) return null
  const hashOutputs = await doubleSha256(concat(...tx.outputs.map(serializeOutput)))
  if (!hashOutputs) return null
  const input = tx.inputs[inputIndex]
  const preimage = concat(
    u32le(tx.version),
    hashPrevouts,
    hashSequence,
    outpoint(input.txid, input.vout),
    varint(scriptCode.length),
    scriptCode,
    u64le(amountSats),
    u32le(input.sequence),
    hashOutputs,
    u32le(tx.locktime),
    u32le(hashType),
  )
  return doubleSha256(preimage)
}

async function legacySighash(
  tx: PsbtVerifyTx,
  inputIndex: number,
  scriptCode: Uint8Array,
  hashType: number,
): Promise<Uint8Array | null> {
  const inputs: Uint8Array[] = []
  for (let i = 0; i < tx.inputs.length; i += 1) {
    const input = tx.inputs[i]
    const script = i === inputIndex ? scriptCode : new Uint8Array()
    inputs.push(concat(outpoint(input.txid, input.vout), varint(script.length), script, u32le(input.sequence)))
  }
  const preimage = concat(
    u32le(tx.version),
    varint(tx.inputs.length),
    ...inputs,
    varint(tx.outputs.length),
    ...tx.outputs.map(serializeOutput),
    u32le(tx.locktime),
    u32le(hashType),
  )
  return doubleSha256(preimage)
}

async function taprootSighash(
  tx: PsbtVerifyTx,
  inputIndex: number,
  hashType: number,
  utxos: Array<{ amountSats: number; script: Uint8Array }>,
  leafHash: Uint8Array | null,
): Promise<Uint8Array | null> {
  const hashPrevouts = await sha256(concat(...tx.inputs.map(input => outpoint(input.txid, input.vout))))
  const hashAmounts = await sha256(concat(...utxos.map(utxo => u64le(utxo.amountSats))))
  const hashScripts = await sha256(concat(...utxos.map(utxo => concat(varint(utxo.script.length), utxo.script))))
  const hashSequences = await sha256(concat(...tx.inputs.map(input => u32le(input.sequence))))
  const hashOutputs = await sha256(concat(...tx.outputs.map(serializeOutput)))
  if (!hashPrevouts || !hashAmounts || !hashScripts || !hashSequences || !hashOutputs) return null

  // Epoch 0x00, then BIP-341 SigMsg. Script-path appends the leaf hash,
  // key version 0 and the default code-separator position.
  const message = concat(
    Uint8Array.from([0x00, hashType]),
    u32le(tx.version),
    u32le(tx.locktime),
    hashPrevouts,
    hashAmounts,
    hashScripts,
    hashSequences,
    hashOutputs,
    Uint8Array.from([leafHash ? 0x02 : 0x00]),
    u32le(inputIndex),
    leafHash ?? new Uint8Array(),
    leafHash ? Uint8Array.from([0x00]) : new Uint8Array(),
    leafHash ? Uint8Array.from([0xff, 0xff, 0xff, 0xff]) : new Uint8Array(),
  )
  return taggedHash('TapSighash', message)
}

function derToCompact(der: Uint8Array): Uint8Array | null {
  try {
    return secp256k1.Signature.fromBytes(der, 'der').toBytes('compact')
  } catch {
    return null
  }
}

async function taprootOutputForLeaf(control: Uint8Array, leafHash: Uint8Array): Promise<Uint8Array | null> {
  if (control.length < 33 || (control.length - 33) % 32 !== 0) return null
  const leafVersion = control[0] & 0xfe
  if (leafVersion !== 0xc0) return null
  let merkle = leafHash
  for (let offset = 33; offset < control.length; offset += 32) {
    const node = control.slice(offset, offset + 32)
    const [left, right] = bytesToHex(merkle) < bytesToHex(node) ? [merkle, node] : [node, merkle]
    const next = await taggedHash('TapBranch', concat(left, right))
    if (!next) return null
    merkle = next
  }
  const internal = control.slice(1, 33)
  const tweak = await taggedHash('TapTweak', concat(internal, merkle))
  if (!tweak) return null
  const tweakInt = bytesToBigInt(tweak)
  if (tweakInt === 0n || tweakInt >= CURVE_ORDER) return null
  try {
    const point = secp256k1.Point.fromHex(bytesToHex(concat(Uint8Array.from([0x02]), internal)))
    return point.add(secp256k1.Point.BASE.multiply(tweakInt)).toBytes(true).slice(1)
  } catch {
    return null
  }
}

async function findTapLeaf(
  values: Uint8Array[],
  leafHash: Uint8Array,
  outputKey: Uint8Array,
): Promise<Uint8Array | null> {
  for (const value of values) {
    for (let controlLength = 33; controlLength < value.length; controlLength += 32) {
      const control = value.slice(0, controlLength)
      const script = value.slice(controlLength)
      if (!script.length) continue
      const leafVersion = control[0] & 0xfe
      const hash = await taggedHash('TapLeaf', concat(Uint8Array.from([leafVersion]), varint(script.length), script))
      if (!hash || !bytesEqual(hash, leafHash)) continue
      const derived = await taprootOutputForLeaf(control, hash)
      if (derived && bytesEqual(derived, outputKey)) return script
    }
  }
  return null
}

async function completeUtxos(inputs: PsbtVerifyInput[]): Promise<Array<{ amountSats: number; script: Uint8Array }> | null> {
  const utxos: Array<{ amountSats: number; script: Uint8Array }> = []
  for (const candidate of inputs) {
    if (candidate.witnessUtxo == null || !candidate.script) return null
    utxos.push({ amountSats: candidate.witnessUtxo, script: candidate.script })
  }
  return utxos
}

export async function verifyPsbtSignatures(
  tx: PsbtVerifyTx,
  inputs: PsbtVerifyInput[],
): Promise<PsbtSignatureCheck[]> {
  const checks: PsbtSignatureCheck[] = []

  for (let index = 0; index < inputs.length; index += 1) {
    const input = inputs[index]
    const kind = input.script ? scriptKind(input.script) : 'unavailable'

    for (const item of input.partialSigs) {
      const pubkey = bytesToHex(item.pubkey)
      const hashType = item.signature[item.signature.length - 1] ?? 0
      if (hashType !== 1) {
        checks.push({ input: index, scheme: 'ecdsa', pubkey, status: 'unsupported', note: `SIGHASH ${hashType} is not verified here; only SIGHASH_ALL is supported.` })
        continue
      }
      if (input.witnessUtxo == null) {
        checks.push({ input: index, scheme: 'ecdsa', pubkey, status: 'unsupported', note: 'No witness UTXO amount, so the sighash cannot be built.' })
        continue
      }

      const plan = await buildEcdsaPlan(input, kind)
      if (typeof plan === 'string') {
        checks.push({ input: index, scheme: 'ecdsa', pubkey, status: 'unsupported', note: plan })
        continue
      }
      if (plan.allowedPubkeys && !plan.allowedPubkeys.some(candidate => bytesEqual(candidate, item.pubkey))) {
        checks.push({ input: index, scheme: 'ecdsa', pubkey, status: 'invalid', note: `The key is not in this ${plan.label} script.` })
        continue
      }
      if (!plan.allowedPubkeys && (kind === 'P2PKH' || kind === 'P2WPKH')) {
        const expected = kind === 'P2PKH' ? input.script!.slice(3, 23) : input.script!.slice(2)
        const actual = await hash160(item.pubkey)
        if (!actual || !bytesEqual(actual, expected)) {
          checks.push({ input: index, scheme: 'ecdsa', pubkey, status: 'invalid', note: `The key does not hash to this ${kind} script.` })
          continue
        }
      }

      const sighash =
        plan.sighash === 'bip143'
          ? await bip143Sighash(tx, index, plan.scriptCode, input.witnessUtxo, hashType)
          : await legacySighash(tx, index, plan.scriptCode, hashType)
      const compact = derToCompact(item.signature.slice(0, -1))
      if (!compact || !sighash) {
        checks.push({ input: index, scheme: 'ecdsa', pubkey, status: 'unsupported', note: 'Signature or sighash could not be decoded.' })
        continue
      }
      let valid = false
      try {
        valid = secp256k1.verify(compact, sighash, item.pubkey, { prehash: false })
      } catch {
        valid = false
      }
      const threshold = plan.multisig ? ` (${plan.multisig.m}-of-${plan.multisig.n}, one valid signature)` : ''
      checks.push({
        input: index,
        scheme: 'ecdsa',
        pubkey,
        status: valid ? 'valid' : 'invalid',
        note: valid
          ? `ECDSA ${plan.label}${threshold} signature verifies over the ${plan.sighash === 'bip143' ? 'BIP-143' : 'legacy'} sighash.`
          : `ECDSA ${plan.label} signature does not verify.`,
      })
    }

    for (const item of input.tapSigs) {
      const pubkey = bytesToHex(item.xonly)
      const hashType = item.signature.length === 65 ? item.signature[64] : 0
      if (hashType !== 0 && hashType !== 1) {
        checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: `Taproot SIGHASH ${hashType} is not verified here.` })
        continue
      }
      if (kind !== 'P2TR' || !input.script) {
        checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: 'This taproot signature is not on a P2TR witness UTXO.' })
        continue
      }
      if (input.witnessUtxo == null) {
        checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: 'No witness UTXO amount, so the taproot sighash cannot be built.' })
        continue
      }
      const utxos = await completeUtxos(inputs)
      if (!utxos) {
        checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: 'Every input needs a witness UTXO for a taproot sighash.' })
        continue
      }

      if (item.leafHash) {
        const leaf = await findTapLeaf(input.tapLeafValues, item.leafHash, input.script.slice(2))
        if (!leaf) {
          checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: 'No tap leaf matches this signature key and control block.' })
          continue
        }
        const sighash = await taprootSighash(tx, index, hashType, utxos, item.leafHash)
        if (!sighash) {
          checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: 'SHA-256 is not available in this browser.' })
          continue
        }
        let valid = false
        try {
          valid = schnorr.verify(item.signature.slice(0, 64), sighash, item.xonly)
        } catch {
          valid = false
        }
        checks.push({
          input: index,
          scheme: 'schnorr',
          pubkey,
          status: valid ? 'valid' : 'invalid',
          note: valid
            ? `Schnorr script-path signature verifies against tapleaf ${bytesToHex(item.leafHash).slice(0, 12)}… and a matching control block.`
            : 'Schnorr script-path signature does not verify.',
        })
        continue
      }

      if (bytesToHex(input.script.slice(2)) !== pubkey) {
        checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: 'The key-path signature key does not match the P2TR output key.' })
        continue
      }
      const sighash = await taprootSighash(tx, index, hashType, utxos, null)
      if (!sighash) {
        checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: 'SHA-256 is not available in this browser.' })
        continue
      }
      let valid = false
      try {
        valid = schnorr.verify(item.signature.slice(0, 64), sighash, item.xonly)
      } catch {
        valid = false
      }
      checks.push({
        input: index,
        scheme: 'schnorr',
        pubkey,
        status: valid ? 'valid' : 'invalid',
        note: valid ? 'Schnorr key-path signature verifies over the BIP-341 sighash.' : 'Schnorr key-path signature does not verify.',
      })
    }
  }

  return checks
}
