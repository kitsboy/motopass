import { secp256k1, schnorr } from '@noble/curves/secp256k1.js'

/**
 * PSBT signature verification for the input types this reader can prove.
 *
 * ECDSA: P2PKH (legacy sighash) and P2WPKH (BIP-143). P2SH-P2WPKH works only
 * when the PSBT carries its redeem script.
 * Schnorr: P2TR key-path with a complete witness UTXO.
 * Anything else is reported as unsupported instead of being called valid.
 *
 * This verifies the cryptographic signature against the transaction. It does
 * not check that the pubkey belongs to the script, and it does not sign or
 * broadcast.
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

export interface PsbtVerifyInput {
  witnessUtxo: number | null
  script: Uint8Array | null
  redeemScript: Uint8Array | null
  partialSigs: Array<{ pubkey: Uint8Array; signature: Uint8Array }>
  tapSigs: Array<{ xonly: Uint8Array; signature: Uint8Array }>
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
  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) return 'P2TR'
  return 'custom'
}

function p2wpkhScript(script: Uint8Array): Uint8Array {
  return concat(Uint8Array.from([0x76, 0xa9, 0x14]), script.slice(2), Uint8Array.from([0x88, 0xac]))
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

/**
 * BIP-341 key-path sighash. `utxos` must have the amount and script for every
 * input; a missing one makes the whole check unsupported.
 */
async function taprootKeyPathSighash(
  tx: PsbtVerifyTx,
  inputIndex: number,
  hashType: number,
  utxos: Array<{ amountSats: number; script: Uint8Array }>,
): Promise<Uint8Array | null> {
  const hashPrevouts = await sha256(concat(...tx.inputs.map(input => outpoint(input.txid, input.vout))))
  const hashAmounts = await sha256(concat(...utxos.map(utxo => u64le(utxo.amountSats))))
  const hashScripts = await sha256(concat(...utxos.map(utxo => concat(varint(utxo.script.length), utxo.script))))
  const hashSequences = await sha256(concat(...tx.inputs.map(input => u32le(input.sequence))))
  const hashOutputs = await sha256(concat(...tx.outputs.map(serializeOutput)))
  if (!hashPrevouts || !hashAmounts || !hashScripts || !hashSequences || !hashOutputs) return null

  // Epoch 0x00, then the BIP-341 SigMsg for a key-path spend (no annex,
  // key_version/codesep_pos are tapscript-only).
  const message = concat(
    Uint8Array.from([0x00, hashType]),
    u32le(tx.version),
    u32le(tx.locktime),
    hashPrevouts,
    hashAmounts,
    hashScripts,
    hashSequences,
    hashOutputs,
    Uint8Array.from([0x00]),
    u32le(inputIndex),
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

      let scriptCode: Uint8Array | null = null
      let sighash: Uint8Array | null = null
      if (kind === 'P2WPKH') {
        scriptCode = p2wpkhScript(input.script!)
        sighash = await bip143Sighash(tx, index, scriptCode, input.witnessUtxo, hashType)
      } else if (kind === 'P2SH' && input.redeemScript && scriptKind(input.redeemScript) === 'P2WPKH') {
        scriptCode = p2wpkhScript(input.redeemScript)
        sighash = await bip143Sighash(tx, index, scriptCode, input.witnessUtxo, hashType)
      } else if (kind === 'P2PKH') {
        scriptCode = input.script!
        sighash = await legacySighash(tx, index, scriptCode, hashType)
      } else {
        checks.push({ input: index, scheme: 'ecdsa', pubkey, status: 'unsupported', note: `ECDSA verification for ${kind} is not implemented.` })
        continue
      }

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
      const sighashName = kind === 'P2PKH' ? 'legacy sighash' : 'BIP-143 sighash'
      checks.push({
        input: index,
        scheme: 'ecdsa',
        pubkey,
        status: valid ? 'valid' : 'invalid',
        note: valid ? `ECDSA ${kind} signature verifies over the ${sighashName}.` : `ECDSA ${kind} signature does not verify.`,
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
      if (input.script.slice(2).length !== 32 || bytesToHex(input.script.slice(2)) !== pubkey) {
        checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: 'The signature key does not match the P2TR output key.' })
        continue
      }
      const utxos: Array<{ amountSats: number; script: Uint8Array }> = []
      let complete = true
      for (const candidate of inputs) {
        if (candidate.witnessUtxo == null || !candidate.script) complete = false
        else utxos.push({ amountSats: candidate.witnessUtxo, script: candidate.script })
      }
      if (!complete) {
        checks.push({ input: index, scheme: 'schnorr', pubkey, status: 'unsupported', note: 'Every input needs a witness UTXO for a taproot sighash.' })
        continue
      }
      const sighash = await taprootKeyPathSighash(tx, index, hashType, utxos)
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
