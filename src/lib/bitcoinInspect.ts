import { bech32Decode, bech32Encode, bytesToHex, bytesToWords, wordsToBytes } from './bech32'
import { verifyPsbtSignatures, type PsbtSignatureCheck, type PsbtVerifyInput } from './psbtVerify'

/**
 * Base-layer readers: address decoding and PSBT map inspection.
 *
 * Addresses are checked against their real checksum (Base58Check or the
 * bech32/bech32m variant required by the witness version). PSBTs are parsed
 * structurally; supported PSBT signatures are verified against the unsigned
 * transaction, and a fee is reported only when every input carries a witness
 * UTXO from which it can be computed.
 * A PSBT does not carry a network, so derived addresses use Bitcoin prefixes
 * and the UI says that explicitly. Nothing is signed or broadcast.
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

function base58Encode(bytes: Uint8Array): string {
  let leadingZeros = 0
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros += 1
  let value = 0n
  for (const byte of bytes) value = (value << 8n) | BigInt(byte)
  let encoded = ''
  while (value > 0n) {
    const digit = Number(value % 58n)
    encoded = BASE58_ALPHABET[digit] + encoded
    value /= 58n
  }
  return '1'.repeat(leadingZeros) + encoded
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

function scriptHex(bytes: ArrayLike<number>): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function base58Check(version: number, hash: Uint8Array): Promise<string | null> {
  const payload = Uint8Array.from([version, ...hash])
  const first = await sha256(payload)
  const second = first ? await sha256(first) : null
  if (!second) return null
  return base58Encode(Uint8Array.from([...payload, ...second.slice(0, 4)]))
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
  nonWitnessUtxo: boolean
  partialSigs: number
  tapSigs: number
  keys: string[]
  address: string | null
  scriptType: string
  prevTxid: string | null
  vout: number | null
  signatures: PsbtSignatureCheck[]
}

export interface PsbtOutput {
  amountSats: number | null
  scriptType: string
  scriptPubKey: string
  address: string | null
  possibleChange: boolean
  addressReuse: boolean
  dust: boolean
}

export interface PsbtInspection {
  version: number
  locktime: number
  inputs: number
  outputs: number
  inputDetails: PsbtInput[]
  outputDetails: PsbtOutput[]
  outputMaps: number
  partialSigs: number
  tapSigs: number
  inputSats: number | null
  outputSats: number | null
  feeSats: number | null
  globalKeys: string[]
  signatureChecks: PsbtSignatureCheck[]
  signaturesValid: number
  signaturesInvalid: number
  signaturesUnsupported: number
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

export function scriptKind(script: Uint8Array): string {
  if (script.length === 25 && script[0] === 0x76 && script[1] === 0xa9 && script[2] === 0x14 && script[23] === 0x88 && script[24] === 0xac) return 'P2PKH'
  if (script.length === 23 && script[0] === 0xa9 && script[1] === 0x14 && script[22] === 0x87) return 'P2SH'
  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) return 'P2WPKH'
  if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) return 'P2WSH'
  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) return 'P2TR'
  return 'custom'
}

export async function scriptToAddress(
  script: Uint8Array,
  network: 'bitcoin' | 'testnet' | 'regtest' = 'bitcoin',
): Promise<{ address: string; type: string } | null> {
  const kind = scriptKind(script)
  const hrp = network === 'bitcoin' ? 'bc' : network === 'testnet' ? 'tb' : 'bcrt'
  if (kind === 'P2WPKH' || kind === 'P2WSH' || kind === 'P2TR') {
    const version = kind === 'P2TR' ? 1 : 0
    const program = script.slice(2)
    return {
      address: bech32Encode(hrp, [version, ...bytesToWords(program)], version === 0 ? 'bech32' : 'bech32m'),
      type: kind,
    }
  }
  if (kind === 'P2PKH') {
    const address = await base58Check(network === 'bitcoin' ? 0x00 : 0x6f, script.slice(3, 23))
    return address ? { address, type: kind } : null
  }
  if (kind === 'P2SH') {
    const address = await base58Check(network === 'bitcoin' ? 0x05 : 0xc4, script.slice(2, 22))
    return address ? { address, type: kind } : null
  }
  return null
}

interface ParsedTx {
  version: number
  locktime: number
  inputs: Array<{ txid: string; vout: number; sequence: number }>
  outputs: Array<{ amountSats: number; script: Uint8Array }>
}

function parseUnsignedTx(bytes: Uint8Array): ParsedTx | null {
  const version = readU32(bytes, 0)
  if (version == null) return null
  const inputCount = readVarint(bytes, 4)
  if (!inputCount) return null
  let cursor = inputCount.next
  const inputs: Array<{ txid: string; vout: number; sequence: number }> = []
  for (let i = 0; i < inputCount.value; i += 1) {
    if (cursor + 36 > bytes.length) return null
    const txid = bytesToHex(Uint8Array.from(bytes.slice(cursor, cursor + 32)).reverse())
    cursor += 32
    const vout = readU32(bytes, cursor)
    if (vout == null) return null
    cursor += 4
    const script = readVarint(bytes, cursor)
    if (!script) return null
    cursor = script.next + script.value
    const sequence = readU32(bytes, cursor)
    if (sequence == null) return null
    cursor += 4
    if (cursor > bytes.length) return null
    inputs.push({ txid, vout, sequence })
  }
  const outputCount = readVarint(bytes, cursor)
  if (!outputCount) return null
  cursor = outputCount.next
  const outputs: Array<{ amountSats: number; script: Uint8Array }> = []
  for (let i = 0; i < outputCount.value; i += 1) {
    const amount = readU64(bytes, cursor)
    if (amount == null) return null
    cursor += 8
    const script = readVarint(bytes, cursor)
    if (!script) return null
    const start = script.next
    const end = start + script.value
    if (end > bytes.length) return null
    outputs.push({ amountSats: amount, script: bytes.slice(start, end) })
    cursor = end
  }
  const locktime = readU32(bytes, cursor)
  if (locktime == null) return null
  return { version, locktime, inputs, outputs }
}

function parseWitnessUtxo(value: Uint8Array): { amountSats: number | null; script: Uint8Array | null } {
  const amountSats = readU64(value, 0)
  const scriptLength = readVarint(value, 8)
  if (!scriptLength) return { amountSats, script: null }
  const start = scriptLength.next
  const end = start + scriptLength.value
  if (end > value.length) return { amountSats, script: null }
  return { amountSats, script: value.slice(start, end) }
}

export async function inspectPsbt(raw: string): Promise<PsbtResult> {
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
  const verifyInputs: PsbtVerifyInput[] = []
  const inputScripts: Uint8Array[] = []
  let partialSigs = 0
  let tapSigs = 0
  let inputSats = 0
  let everyWitnessUtxo = true
  for (let i = 0; i < tx.inputs.length; i += 1) {
    const map = readMap(bytes, cursor)
    if (!map) return { ok: false, error: `Input ${i} map is truncated` }
    cursor = map.next
    let witnessUtxo: number | null = null
    let utxoScript: Uint8Array | null = null
    let witnessScript: Uint8Array | null = null
    let redeemScript: Uint8Array | null = null
    let nonWitnessUtxo = false
    let inputPartial = 0
    let inputTap = 0
    const keys: string[] = []
    const partialEntries: Array<{ pubkey: Uint8Array; signature: Uint8Array }> = []
    const tapEntries: Array<{ xonly: Uint8Array; signature: Uint8Array; leafHash: Uint8Array | null }> = []
    const tapLeafValues: Uint8Array[] = []
    for (const entry of map.entries) {
      const type = entry.key[0]
      keys.push(`0x${type.toString(16).padStart(2, '0')}`)
      if (type === 0x00) nonWitnessUtxo = true
      else if (type === 0x01) {
        const parsed = parseWitnessUtxo(entry.value)
        witnessUtxo = parsed.amountSats
        utxoScript = parsed.script
      } else if (type === 0x02 && entry.key.length >= 34) {
        inputPartial += 1
        partialEntries.push({ pubkey: entry.key.slice(1), signature: entry.value })
      } else if (type === 0x04) redeemScript = entry.value
      else if (type === 0x05) witnessScript = entry.value
      else if (type === 0x13 && (entry.key.length === 33 || entry.key.length === 65)) {
        inputTap += 1
        tapEntries.push({
          xonly: entry.key.slice(1, 33),
          signature: entry.value,
          leafHash: entry.key.length === 65 ? entry.key.slice(33) : null,
        })
      } else if (type === 0x15) tapLeafValues.push(entry.value)
    }
    partialSigs += inputPartial
    tapSigs += inputTap
    if (witnessUtxo == null) everyWitnessUtxo = false
    else inputSats += witnessUtxo
    const derived = utxoScript ? await scriptToAddress(utxoScript) : null
    verifyInputs.push({
      witnessUtxo,
      script: utxoScript,
      redeemScript,
      witnessScript,
      partialSigs: partialEntries,
      tapSigs: tapEntries,
      tapLeafValues,
    })
    inputScripts.push(utxoScript ?? new Uint8Array())
    inputDetails.push({
      witnessUtxo,
      nonWitnessUtxo,
      partialSigs: inputPartial,
      tapSigs: inputTap,
      keys,
      address: derived?.address ?? null,
      scriptType: utxoScript ? scriptKind(utxoScript) : 'unavailable',
      prevTxid: tx.inputs[i].txid,
      vout: tx.inputs[i].vout,
      signatures: [],
    })
  }

  let outputMaps = 0
  const outputDetails: PsbtOutput[] = []
  for (const output of tx.outputs) {
    const map = readMap(bytes, cursor)
    if (!map) return { ok: false, error: `Output ${outputMaps} map is truncated` }
    cursor = map.next
    outputMaps += 1
    const derived = await scriptToAddress(output.script)
    outputDetails.push({
      amountSats: output.amountSats,
      scriptType: scriptKind(output.script),
      scriptPubKey: bytesToHex(output.script),
      address: derived?.address ?? null,
      possibleChange: false,
      addressReuse: false,
      dust: false,
    })
  }

  const warnings: string[] = []
  if (cursor !== bytes.length) warnings.push('Trailing bytes after the output maps.')
  if (!everyWitnessUtxo) {
    warnings.push('At least one input has no witness UTXO, so the fee and input address are unavailable.')
  }
  for (let i = 0; i < inputDetails.length; i += 1) {
    const input = inputDetails[i]
    if (input.witnessUtxo == null && !input.nonWitnessUtxo) {
      warnings.push(`Input ${i} has neither a witness UTXO nor a non-witness UTXO; its amount cannot be checked.`)
    } else if (input.witnessUtxo == null) {
      warnings.push(`Input ${i} has a non-witness UTXO only; this reader cannot derive its address or include its amount.`)
    }
  }

  const outputSats = outputDetails.reduce<number | null>(
    (sum, output) => (sum == null || output.amountSats == null ? null : sum + output.amountSats),
    0,
  )
  const feeSats =
    everyWitnessUtxo && outputSats != null && inputSats >= outputSats ? inputSats - outputSats : null
  if (feeSats != null && inputSats > 0 && feeSats > inputSats * 0.2) {
    warnings.push(`Fee is ${((feeSats / inputSats) * 100).toFixed(1)}% of the input value; check the change output before signing.`)
  }

  const seenOutputs = new Map<string, number>()
  const inputScriptSet = new Set(inputScripts.filter(script => script.length > 0).map(script => bytesToHex(script)))
  for (let i = 0; i < outputDetails.length; i += 1) {
    const output = outputDetails[i]
    const hex = output.scriptPubKey
    const duplicateOf = seenOutputs.get(hex)
    const matchesInput = inputScriptSet.has(hex)
    output.addressReuse = duplicateOf != null || matchesInput
    output.possibleChange = matchesInput
    const dustThreshold = output.scriptType === 'P2TR' || output.scriptType === 'P2WPKH' || output.scriptType === 'P2WSH' ? 330 : 546
    output.dust = output.scriptType !== 'custom' && output.amountSats != null && output.amountSats > 0 && output.amountSats < dustThreshold
    if (duplicateOf != null) warnings.push(`Output ${i} reuses the same script as output ${duplicateOf}.`)
    if (matchesInput) warnings.push(`Output ${i} pays the same script as an input; possible change, not proof.`)
    if (output.dust) warnings.push(`Output ${i} is below the ${dustThreshold} sat dust threshold.`)
    if (!seenOutputs.has(hex)) seenOutputs.set(hex, i)
  }

  const signatureChecks = await verifyPsbtSignatures(
    { version: tx.version, locktime: tx.locktime, inputs: tx.inputs, outputs: tx.outputs },
    verifyInputs,
  )
  for (const check of signatureChecks) inputDetails[check.input]?.signatures.push(check)
  const signaturesValid = signatureChecks.filter(check => check.status === 'valid').length
  const signaturesInvalid = signatureChecks.filter(check => check.status === 'invalid').length
  const signaturesUnsupported = signatureChecks.filter(check => check.status === 'unsupported').length
  if (signaturesInvalid > 0) warnings.push(`${signaturesInvalid} PSBT signature(s) do not verify.`)
  if (signaturesUnsupported > 0) warnings.push(`${signaturesUnsupported} PSBT signature(s) could not be checked by this reader.`)

  return {
    ok: true,
    psbt: {
      version: tx.version,
      locktime: tx.locktime,
      inputs: tx.inputs.length,
      outputs: tx.outputs.length,
      inputDetails,
      outputDetails,
      outputMaps,
      partialSigs,
      tapSigs,
      inputSats: everyWitnessUtxo ? inputSats : null,
      outputSats,
      feeSats,
      globalKeys: global.entries.map(entry => `0x${entry.key[0].toString(16).padStart(2, '0')}`),
      signatureChecks,
      signaturesValid,
      signaturesInvalid,
      signaturesUnsupported,
      warnings,
    },
  }
}

export type BitcoinInspectResult =
  | { kind: 'address'; result: AddressResult }
  | { kind: 'psbt'; result: PsbtResult }

export async function inspectBitcoinInput(raw: string): Promise<BitcoinInspectResult> {
  const text = raw.trim()
  if (/^(cHNidP|70736274ff)/i.test(text)) return { kind: 'psbt', result: await inspectPsbt(text) }
  return { kind: 'address', result: await inspectAddress(text) }
}
