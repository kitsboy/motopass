import { bech32Decode, bytesToHex, wordsToBytes } from './bech32'

/**
 * Base-layer readers: address decoding and PSBT map inspection.
 *
 * Addresses are checked against their real checksum (Base58Check or the
 * bech32/bech32m variant required by the witness version). PSBTs are parsed
 * structurally; signatures are counted, not verified, and a fee is reported
 * only when every input carries a witness UTXO from which it can be computed.
 * Nothing is signed or broadcast.
 */

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export interface AddressInspection {
  address: string
  network: string
  type: string
  scriptPubKey: string
  program: string | null
  warning: string | null
}

export type AddressResult = { ok: true; address: AddressInspection } | { ok: false; error: string }

function base58Decode(value: string): Uint8Array | null {
  if (!value || [...value].some(ch => !BASE58_ALPHABET.includes(ch))) return null
  const bytes: number[] = [0]
  for (const ch of value) {
    let carry = BASE58_ALPHABET.indexOf(ch)
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
  for (const ch of value) {
    if (ch !== '1') break
    leadingZeros += 1
  }
  while (bytes.length > 1 && bytes[0] === 0) bytes.shift()
  return Uint8Array.from([...new Array(leadingZeros).fill(0), ...bytes])
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

function scriptHex(bytes: number[]): string {
  return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('')
}

/** Async because Base58Check needs a double SHA-256. */
export async function inspectAddress(raw: string): Promise<AddressResult> {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Paste an address first' }

  if (/^(bc|tb|bcrt)1/i.test(value)) {
    const decoded = bech32Decode(value, { checksum: true, encoding: 'any' })
    if (!decoded.ok) return { ok: false, error: decoded.error }
    const network = decoded.hrp === 'bc' ? 'bitcoin' : decoded.hrp === 'tb' ? 'testnet' : 'regtest'
    if (decoded.words.length < 1) return { ok: false, error: 'Segwit address has no witness version' }
    const version = decoded.words[0]
    if (version > 16) return { ok: false, error: 'Witness version is outside 0–16' }
    const program = wordsToBytes(decoded.words.slice(1))
    if (!program || program.length < 2 || program.length > 40) {
      return { ok: false, error: 'Witness program is not 2–40 bytes' }
    }
    if (version === 0 && program.length !== 20 && program.length !== 32) {
      return { ok: false, error: 'Witness v0 program must be 20 or 32 bytes' }
    }
    const expected = version === 0 ? 'bech32' : 'bech32m'
    if (decoded.encoding !== expected) {
      return { ok: false, error: `Witness v${version} must use ${expected}, not ${decoded.encoding}` }
    }
    const op = version === 0 ? 0 : 0x50 + version
    return {
      ok: true,
      address: {
        address: value.toLowerCase(),
        network,
        type: version === 0 ? (program.length === 20 ? 'P2WPKH' : 'P2WSH') : 'P2TR',
        scriptPubKey: scriptHex([op, program.length, ...program]),
        program: bytesToHex(program),
        warning: null,
      },
    }
  }

  const decoded = base58Decode(value)
  if (!decoded) return { ok: false, error: 'Not a Base58 address or a bech32/bech32m address' }
  if (decoded.length !== 25) return { ok: false, error: 'Base58Check payload is not 25 bytes' }
  const payload = decoded.slice(0, 21)
  const checksum = decoded.slice(21)
  const first = await sha256(payload)
  const second = first ? await sha256(first) : null
  if (!second) return { ok: false, error: 'SHA-256 is not available in this browser' }
  if (bytesToHex(second.slice(0, 4)) !== bytesToHex(checksum)) {
    return { ok: false, error: 'Base58Check checksum failed' }
  }

  const version = payload[0]
  const hash = payload.slice(1)
  let network = ''
  let type = ''
  let script: number[]
  if (version === 0x00 || version === 0x6f) {
    network = version === 0x00 ? 'bitcoin' : 'testnet/regtest'
    type = 'P2PKH'
    script = [0x76, 0xa9, 0x14, ...hash, 0x88, 0xac]
  } else if (version === 0x05 || version === 0xc4) {
    network = version === 0x05 ? 'bitcoin' : 'testnet/regtest'
    type = 'P2SH'
    script = [0xa9, 0x14, ...hash, 0x87]
  } else {
    return { ok: false, error: `Unknown Base58 version byte 0x${version.toString(16)}` }
  }

  return {
    ok: true,
    address: {
      address: value,
      network,
      type,
      scriptPubKey: scriptHex(script),
      program: bytesToHex(hash),
      warning: null,
    },
  }
}

export interface PsbtInput {
  witnessUtxo: number | null
  partialSigs: number
  tapSigs: number
  keys: string[]
}

export interface PsbtInspection {
  version: number
  locktime: number
  inputs: number
  outputs: number
  inputDetails: PsbtInput[]
  outputMaps: number
  partialSigs: number
  tapSigs: number
  inputSats: number | null
  outputSats: number | null
  feeSats: number | null
  globalKeys: string[]
  warnings: string[]
}

export type PsbtResult = { ok: true; psbt: PsbtInspection } | { ok: false; error: string }

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

function readU32(bytes: Uint8Array, offset: number): number | null {
  if (offset + 4 > bytes.length) return null
  return bytes[offset] + bytes[offset + 1] * 0x100 + bytes[offset + 2] * 0x10000 + bytes[offset + 3] * 0x1000000
}

function readU64(bytes: Uint8Array, offset: number): number | null {
  if (offset + 8 > bytes.length) return null
  let value = 0n
  for (let i = 7; i >= 0; i -= 1) value = (value << 8n) | BigInt(bytes[offset + i])
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null
}

interface MapEntry {
  key: Uint8Array
  value: Uint8Array
}

function readMap(bytes: Uint8Array, offset: number): { entries: MapEntry[]; next: number } | null {
  const entries: MapEntry[] = []
  let cursor = offset
  while (cursor < bytes.length) {
    const keyLength = readVarint(bytes, cursor)
    if (!keyLength) return null
    if (keyLength.value === 0) return { entries, next: keyLength.next }
    const keyStart = keyLength.next
    const keyEnd = keyStart + keyLength.value
    if (keyEnd > bytes.length) return null
    const valueLength = readVarint(bytes, keyEnd)
    if (!valueLength) return null
    const valueStart = valueLength.next
    const valueEnd = valueStart + valueLength.value
    if (valueEnd > bytes.length) return null
    entries.push({ key: bytes.slice(keyStart, keyEnd), value: bytes.slice(valueStart, valueEnd) })
    cursor = valueEnd
  }
  return null
}

function scriptKind(script: Uint8Array): string {
  if (script.length === 25 && script[0] === 0x76 && script[1] === 0xa9 && script[2] === 0x14 && script[23] === 0x88 && script[24] === 0xac) return 'P2PKH'
  if (script.length === 23 && script[0] === 0xa9 && script[1] === 0x14 && script[22] === 0x87) return 'P2SH'
  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) return 'P2WPKH'
  if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) return 'P2WSH'
  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) return 'P2TR'
  return 'custom'
}

function parseUnsignedTx(bytes: Uint8Array): {
  version: number
  locktime: number
  inputCount: number
  outputCount: number
  outputSats: number | null
  outputKinds: string[]
} | null {
  const version = readU32(bytes, 0)
  if (version == null) return null
  const inputCount = readVarint(bytes, 4)
  if (!inputCount) return null
  let cursor = inputCount.next
  for (let i = 0; i < inputCount.value; i += 1) {
    cursor += 36
    const script = readVarint(bytes, cursor)
    if (!script) return null
    cursor = script.next + script.value + 4
    if (cursor > bytes.length) return null
  }
  const outputCount = readVarint(bytes, cursor)
  if (!outputCount) return null
  cursor = outputCount.next
  let outputSats: number | null = 0
  const outputKinds: string[] = []
  for (let i = 0; i < outputCount.value; i += 1) {
    const amount = readU64(bytes, cursor)
    if (amount == null) return null
    cursor += 8
    const script = readVarint(bytes, cursor)
    if (!script) return null
    const start = script.next
    const end = start + script.value
    if (end > bytes.length) return null
    const kind = scriptKind(bytes.slice(start, end))
    outputKinds.push(kind)
    outputSats = outputSats == null ? null : outputSats + amount
    if (!Number.isSafeInteger(outputSats)) outputSats = null
    cursor = end
  }
  const locktime = readU32(bytes, cursor)
  if (locktime == null) return null
  return { version, locktime, inputCount: inputCount.value, outputCount: outputCount.value, outputSats, outputKinds }
}

export function inspectPsbt(raw: string): PsbtResult {
  const text = raw.trim()
  if (!text) return { ok: false, error: 'Paste a base64 or hex PSBT first' }

  let bytes: Uint8Array
  if (/^[0-9a-fA-F]+$/.test(text)) {
    if (text.length % 2 !== 0) return { ok: false, error: 'Hex PSBT has an odd number of characters' }
    bytes = Uint8Array.from(text.match(/.{2}/g)?.map(byte => Number.parseInt(byte, 16)) ?? [])
  } else {
    try {
      const binary = atob(text)
      bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    } catch {
      return { ok: false, error: 'Not valid base64 or hex' }
    }
  }

  const magic = [0x70, 0x73, 0x62, 0x74, 0xff]
  if (bytes.length < 5 || !magic.every((byte, index) => bytes[index] === byte)) {
    return { ok: false, error: 'Missing PSBT magic (70736274ff)' }
  }

  const global = readMap(bytes, 5)
  if (!global) return { ok: false, error: 'Global PSBT map is truncated or has no separator' }
  const unsigned = global.entries.find(entry => entry.key.length === 1 && entry.key[0] === 0x00)
  if (!unsigned) return { ok: false, error: 'PSBT has no unsigned transaction (global key 0x00)' }
  const tx = parseUnsignedTx(unsigned.value)
  if (!tx) return { ok: false, error: 'Unsigned transaction could not be parsed' }

  let cursor = global.next
  const inputDetails: PsbtInput[] = []
  let partialSigs = 0
  let tapSigs = 0
  let inputSats = 0
  let everyWitnessUtxo = true
  for (let i = 0; i < tx.inputCount; i += 1) {
    const map = readMap(bytes, cursor)
    if (!map) return { ok: false, error: `Input ${i} map is truncated` }
    cursor = map.next
    let witnessUtxo: number | null = null
    let inputPartial = 0
    let inputTap = 0
    const keys: string[] = []
    for (const entry of map.entries) {
      const type = entry.key[0]
      keys.push(`0x${type.toString(16).padStart(2, '0')}`)
      if (type === 0x01) {
        witnessUtxo = readU64(entry.value, 0)
      } else if (type === 0x02) inputPartial += 1
      else if (type === 0x13) inputTap += 1
    }
    partialSigs += inputPartial
    tapSigs += inputTap
    if (witnessUtxo == null) everyWitnessUtxo = false
    else inputSats += witnessUtxo
    inputDetails.push({ witnessUtxo, partialSigs: inputPartial, tapSigs: inputTap, keys })
  }

  let outputMaps = 0
  for (let i = 0; i < tx.outputCount; i += 1) {
    const map = readMap(bytes, cursor)
    if (!map) return { ok: false, error: `Output ${i} map is truncated` }
    cursor = map.next
    outputMaps += 1
  }

  const warnings: string[] = []
  if (cursor !== bytes.length) warnings.push('Trailing bytes after the output maps.')
  if (!everyWitnessUtxo) warnings.push('At least one input has no witness UTXO, so the fee is not computed.')
  const feeSats =
    everyWitnessUtxo && tx.outputSats != null && inputSats >= tx.outputSats ? inputSats - tx.outputSats : null

  return {
    ok: true,
    psbt: {
      version: tx.version,
      locktime: tx.locktime,
      inputs: tx.inputCount,
      outputs: tx.outputCount,
      inputDetails,
      outputMaps,
      partialSigs,
      tapSigs,
      inputSats: everyWitnessUtxo ? inputSats : null,
      outputSats: tx.outputSats,
      feeSats,
      globalKeys: global.entries.map(entry => `0x${entry.key[0].toString(16).padStart(2, '0')}`),
      warnings,
    },
  }
}

export type BitcoinInspectResult =
  | { kind: 'address'; result: AddressResult }
  | { kind: 'psbt'; result: PsbtResult }

export async function inspectBitcoinInput(raw: string): Promise<BitcoinInspectResult> {
  const text = raw.trim()
  if (/^(cHNidP|70736274ff)/i.test(text)) return { kind: 'psbt', result: inspectPsbt(text) }
  return { kind: 'address', result: await inspectAddress(text) }
}
