import { sha256 } from '@noble/hashes/sha2.js'

/**
 * Minimal transaction reader and the three sighash families BIP-322 needs.
 *
 * This is deliberately a structural reader, not a consensus engine. It parses
 * standard network serialization, preserves scripts and witnesses, and builds
 * the exact virtual transaction BIP-322 defines. Script interpretation lives
 * in `bip322Full.ts` and is limited to the classes it names.
 */

export interface Bip322Input {
  txid: string
  vout: number
  scriptSig: Uint8Array
  sequence: number
  witness: Uint8Array[]
}

export interface Bip322Output {
  value: number
  script: Uint8Array
}

export interface Bip322Transaction {
  version: number
  locktime: number
  inputs: Bip322Input[]
  outputs: Bip322Output[]
}

export interface Bip322Prevout {
  value: number
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

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function hexToBytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g)?.map(byte => Number.parseInt(byte, 16)) ?? [])
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, index) => byte === b[index])
}

export function u32le(value: number): Uint8Array {
  return Uint8Array.from([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
}

export function u64le(value: number): Uint8Array {
  const out = new Uint8Array(8)
  let remaining = BigInt(value)
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number(remaining & 0xffn)
    remaining >>= 8n
  }
  return out
}

export function varint(value: number): Uint8Array {
  if (value < 0xfd) return Uint8Array.from([value])
  if (value <= 0xffff) return Uint8Array.from([0xfd, value & 0xff, value >>> 8])
  if (value <= 0xffffffff) {
    return Uint8Array.from([0xfe, value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
  }
  return concat(Uint8Array.from([0xff]), u64le(value))
}

export function readVarint(bytes: Uint8Array, offset: number): { value: number; next: number } | null {
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

export function readU32(bytes: Uint8Array, offset: number): number | null {
  if (offset + 4 > bytes.length) return null
  return bytes[offset] + bytes[offset + 1] * 0x100 + bytes[offset + 2] * 0x10000 + bytes[offset + 3] * 0x1000000
}

export function readU64(bytes: Uint8Array, offset: number): number | null {
  if (offset + 8 > bytes.length) return null
  let value = 0n
  for (let i = 7; i >= 0; i -= 1) value = (value << 8n) | BigInt(bytes[offset + i])
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null
}

export function readByteVector(bytes: Uint8Array, offset: number): { value: Uint8Array; next: number } | null {
  const length = readVarint(bytes, offset)
  if (!length || offset + length.next - offset + length.value > bytes.length) return null
  const start = length.next
  const end = start + length.value
  if (end > bytes.length) return null
  return { value: bytes.slice(start, end), next: end }
}

export function readWitness(bytes: Uint8Array, offset: number): { value: Uint8Array[]; next: number } | null {
  const count = readVarint(bytes, offset)
  if (!count || count.value > 256) return null
  let cursor = count.next
  const items: Uint8Array[] = []
  for (let i = 0; i < count.value; i += 1) {
    const item = readByteVector(bytes, cursor)
    if (!item) return null
    items.push(item.value)
    cursor = item.next
  }
  return { value: items, next: cursor }
}

export function doubleSha256(bytes: Uint8Array): Uint8Array {
  return sha256(sha256(bytes))
}

export function taggedHash(tag: string, message: Uint8Array): Uint8Array {
  const tagHash = sha256(new TextEncoder().encode(tag))
  return sha256(concat(tagHash, tagHash, message))
}

export function serializeOutput(output: Bip322Output): Uint8Array {
  return concat(u64le(output.value), varint(output.script.length), output.script)
}

export function serializeBip322Tx(tx: Bip322Transaction, includeWitness = true): Uint8Array {
  const hasWitness = includeWitness && tx.inputs.some(input => input.witness.length > 0)
  const parts: Uint8Array[] = [u32le(tx.version)]
  if (hasWitness) parts.push(Uint8Array.from([0x00, 0x01]))
  parts.push(varint(tx.inputs.length))
  for (const input of tx.inputs) {
    parts.push(hexToBytes(input.txid).slice().reverse(), u32le(input.vout), varint(input.scriptSig.length), input.scriptSig, u32le(input.sequence))
  }
  parts.push(varint(tx.outputs.length))
  for (const output of tx.outputs) parts.push(serializeOutput(output))
  if (hasWitness) {
    for (const input of tx.inputs) {
      parts.push(varint(input.witness.length))
      for (const item of input.witness) parts.push(varint(item.length), item)
    }
  }
  parts.push(u32le(tx.locktime))
  return concat(...parts)
}

export function bip322Txid(tx: Bip322Transaction): string {
  return bytesToHex(doubleSha256(serializeBip322Tx(tx, false)).reverse())
}

export function parseBip322Tx(bytes: Uint8Array): Bip322Transaction | null {
  const version = readU32(bytes, 0)
  if (version == null) return null
  let cursor = 4
  const inputCount = readVarint(bytes, cursor)
  if (!inputCount) return null
  cursor = inputCount.next
  let witness = false
  let actualInputCount = inputCount.value
  if (actualInputCount === 0) {
    if (bytes[cursor] !== 0x01) return null
    witness = true
    cursor += 1
    const realCount = readVarint(bytes, cursor)
    if (!realCount) return null
    actualInputCount = realCount.value
    cursor = realCount.next
  }
  if (actualInputCount > 1000) return null

  const inputs: Bip322Input[] = []
  for (let i = 0; i < actualInputCount; i += 1) {
    if (cursor + 36 > bytes.length) return null
    const txidBytes = bytes.slice(cursor, cursor + 32).slice().reverse()
    const txid = bytesToHex(txidBytes)
    cursor += 32
    const vout = readU32(bytes, cursor)
    if (vout == null) return null
    cursor += 4
    const script = readByteVector(bytes, cursor)
    if (!script) return null
    cursor = script.next
    const sequence = readU32(bytes, cursor)
    if (sequence == null) return null
    cursor += 4
    inputs.push({ txid, vout, scriptSig: script.value, sequence, witness: [] })
  }

  const outputCount = readVarint(bytes, cursor)
  if (!outputCount) return null
  cursor = outputCount.next
  if (outputCount.value > 1000) return null
  const outputs: Bip322Output[] = []
  for (let i = 0; i < outputCount.value; i += 1) {
    const value = readU64(bytes, cursor)
    if (value == null) return null
    cursor += 8
    const script = readByteVector(bytes, cursor)
    if (!script) return null
    outputs.push({ value, script: script.value })
    cursor = script.next
  }

  if (witness) {
    for (const input of inputs) {
      const stack = readWitness(bytes, cursor)
      if (!stack) return null
      input.witness = stack.value
      cursor = stack.next
    }
  }

  const locktime = readU32(bytes, cursor)
  if (locktime == null) return null
  cursor += 4
  if (cursor !== bytes.length) return null
  return { version, locktime, inputs, outputs }
}

export function legacySighash(
  tx: Bip322Transaction,
  inputIndex: number,
  scriptCode: Uint8Array,
  hashType: number,
): Uint8Array | null {
  if (inputIndex < 0 || inputIndex >= tx.inputs.length) return null
  const clone: Bip322Transaction = {
    version: tx.version,
    locktime: tx.locktime,
    inputs: tx.inputs.map((input, index) => ({
      ...input,
      scriptSig: index === inputIndex ? scriptCode : new Uint8Array(),
      witness: [],
    })),
    outputs: tx.outputs,
  }
  return doubleSha256(concat(serializeBip322Tx(clone, false), u32le(hashType)))
}

export function bip143Sighash(
  tx: Bip322Transaction,
  inputIndex: number,
  scriptCode: Uint8Array,
  amountSats: number,
  hashType: number,
): Uint8Array | null {
  const input = tx.inputs[inputIndex]
  if (!input) return null
  const hashPrevouts = doubleSha256(concat(...tx.inputs.map(item => concat(hexToBytes(item.txid).slice().reverse(), u32le(item.vout)))))
  const hashSequence = doubleSha256(concat(...tx.inputs.map(item => u32le(item.sequence))))
  const hashOutputs = doubleSha256(concat(...tx.outputs.map(serializeOutput)))
  const preimage = concat(
    u32le(tx.version),
    hashPrevouts,
    hashSequence,
    hexToBytes(input.txid).slice().reverse(),
    u32le(input.vout),
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

export function taprootSighash(
  tx: Bip322Transaction,
  inputIndex: number,
  prevouts: Bip322Prevout[],
  hashType: number,
): Uint8Array | null {
  if (prevouts.length !== tx.inputs.length) return null
  const hashPrevouts = sha256(concat(...tx.inputs.map(item => concat(hexToBytes(item.txid).slice().reverse(), u32le(item.vout)))))
  const hashAmounts = sha256(concat(...prevouts.map(prevout => u64le(prevout.value))))
  const hashScripts = sha256(concat(...prevouts.map(prevout => concat(varint(prevout.script.length), prevout.script))))
  const hashSequences = sha256(concat(...tx.inputs.map(item => u32le(item.sequence))))
  const hashOutputs = sha256(concat(...tx.outputs.map(serializeOutput)))
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
