import { describe, expect, it } from 'vitest'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { bech32Decode, bech32Encode, bytesToWords, wordsToBytes } from './bech32'
import { bip322ToSpendTxidForScript } from './bip322'
import { verifyBip322Full } from './bip322Full'
import {
  bip143Sighash,
  doubleSha256,
  legacySighash,
  readWitness,
  serializeBip322Tx,
  u64le,
  varint,
  type Bip322Transaction,
} from './bip322Tx'

const P2WPKH = {
  address: 'bc1q9vza2e8x573nczrlzms0wvx3gsqjx7vavgkx0l',
  message: 'Hello World',
  signature:
    'AkcwRAIgZRfIY3p7/DoVTty6YZbWS71bc5Vct9p9Fia83eRmw2QCICK/ENGfwLtptFluMGs2KsqoNSk89pO7F29zJLUx9a/sASECx/EgAxlkQpQ9hYjgGu6EBCPMVPwVIVJqO4XCsMvViHI=',
}

const TAPROOT = {
  address: 'bc1pss0zhytly75awhm6x2hhvd5lnzv3vssgrf9axfheq8ldyzn88ges79fler',
  message: 'No prefix fallback',
  signature: 'AUCJYOwOjxYAvatTAGYaVlNXBVyFuc4MwNQkOuK2tl8xhfKDONd0NjfYyNSYcRqeCp8hsAnCEPHAVEkO9h6vbQ/R',
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

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

function encodeBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function p2wpkhScript(address: string): Uint8Array {
  const decoded = bech32Decode(address, { checksum: true, encoding: 'bech32' })
  if (!decoded.ok || !decoded.words.length) throw new Error('test address did not decode')
  const program = wordsToBytes(decoded.words.slice(1))
  if (!program) throw new Error('test program did not decode')
  return concat(Uint8Array.from([0x00, 0x14]), program)
}

function p2trScript(address: string): Uint8Array {
  const decoded = bech32Decode(address, { checksum: true, encoding: 'bech32m' })
  if (!decoded.ok || !decoded.words.length) throw new Error('test taproot address did not decode')
  const program = wordsToBytes(decoded.words.slice(1))
  if (!program) throw new Error('test taproot program did not decode')
  return concat(Uint8Array.from([0x51, 0x20]), program)
}

function push(data: Uint8Array): Uint8Array {
  if (data.length > 75) throw new Error('test helper only supports direct pushes')
  return concat(Uint8Array.from([data.length]), data)
}

function p2pkhAddress(program: Uint8Array): string {
  const payload = concat(Uint8Array.from([0x00]), program)
  const checksum = doubleSha256(payload).slice(0, 4)
  const bytes = concat(payload, checksum)
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let value = 0n
  for (const byte of bytes) value = (value << 8n) | BigInt(byte)
  let encoded = ''
  while (value > 0n) {
    encoded = alphabet[Number(value % 58n)] + encoded
    value /= 58n
  }
  let leadingZeros = 0
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros += 1
  return `${'1'.repeat(leadingZeros)}${encoded}`
}

function signedWitness(tx: Bip322Transaction, index: number, scriptCode: Uint8Array, amount: number, secret: Uint8Array) {
  const sighash = bip143Sighash(tx, index, scriptCode, amount, 1)
  if (!sighash) throw new Error('missing sighash')
  const signature = secp256k1.sign(sighash, secret, { prehash: false, format: 'der' })
  return concat(signature, Uint8Array.from([0x01]))
}

function witnessStack(items: Uint8Array[]): Uint8Array {
  return concat(varint(items.length), ...items.flatMap(item => [varint(item.length), item]))
}

function psbtMap(entries: Array<{ key: number[]; value: number[] }>): number[] {
  const out: number[] = []
  for (const entry of entries) {
    out.push(entry.key.length, ...entry.key, entry.value.length, ...entry.value)
  }
  out.push(0)
  return out
}

function toSignTx(toSpendTxid: string, scriptSig: Uint8Array, witness: Uint8Array[]): Bip322Transaction {
  return {
    version: 0,
    locktime: 0,
    inputs: [{ txid: toSpendTxid, vout: 0, scriptSig, sequence: 0, witness }],
    outputs: [{ value: 0, script: Uint8Array.from([0x6a]) }],
  }
}

describe('BIP-322 full and proof-of-funds', () => {
  it('verifies the published P2WPKH signature when carried as a full transaction', () => {
    const script = p2wpkhScript(P2WPKH.address)
    const stack = readWitness(decodeBase64(P2WPKH.signature), 0)
    if (!stack || stack.value.length !== 2) throw new Error('published witness did not decode')
    const [signature, pubkey] = stack.value
    const tx = toSignTx(bip322ToSpendTxidForScript(P2WPKH.message, script), new Uint8Array(), [signature, pubkey])
    const proof = `ful${encodeBase64(serializeBip322Tx(tx))}`
    const result = verifyBip322Full(P2WPKH.address, P2WPKH.message, proof)
    expect(result.status, result.note).toBe('valid')
    expect(result.format).toBe('BIP-322 full')
    expect(result.addressType).toBe('P2WPKH')
  })

  it('verifies a P2PKH legacy full proof over the legacy sighash', () => {
    const secret = Uint8Array.from({ length: 32 }, (_, index) => index + 1)
    const pubkey = secp256k1.getPublicKey(secret, true)
    const program = Uint8Array.from(ripemd160(sha256(pubkey)))
    const script = concat(Uint8Array.from([0x76, 0xa9, 0x14]), program, Uint8Array.from([0x88, 0xac]))
    const address = p2pkhAddress(program)
    const unsigned = toSignTx(bip322ToSpendTxidForScript('legacy full', script), new Uint8Array(), [])
    const sighash = legacySighash(unsigned, 0, script, 1)
    if (!sighash) throw new Error('missing legacy sighash')
    const signature = secp256k1.sign(sighash, secret, { prehash: false, format: 'der' })
    const tx = toSignTx(bip322ToSpendTxidForScript('legacy full', script), concat(push(concat(signature, Uint8Array.from([1]))), push(pubkey)), [])
    const result = verifyBip322Full(address, 'legacy full', `ful${encodeBase64(serializeBip322Tx(tx))}`)
    expect(result.status, result.note).toBe('valid')
    expect(result.addressType).toBe('P2PKH')
  })

  it('verifies a published P2TR key-path full proof', () => {
    const script = p2trScript(TAPROOT.address)
    const stack = readWitness(decodeBase64(TAPROOT.signature), 0)
    if (!stack || stack.value.length !== 1) throw new Error('published taproot witness did not decode')
    const tx = toSignTx(bip322ToSpendTxidForScript(TAPROOT.message, script), new Uint8Array(), stack.value)
    const result = verifyBip322Full(TAPROOT.address, TAPROOT.message, `ful${encodeBase64(serializeBip322Tx(tx))}`)
    expect(result.status, result.note).toBe('valid')
    expect(result.addressType).toBe('P2TR')
  })

  it('verifies a finalized proof-of-funds PSBT with a second signed UTXO', () => {
    const secret = Uint8Array.from({ length: 32 }, (_, index) => 32 - index)
    const pubkey = secp256k1.getPublicKey(secret, true)
    const program = Uint8Array.from(ripemd160(sha256(pubkey)))
    const script = concat(Uint8Array.from([0x00, 0x14]), program)
    const address = bech32Encode('bc', [0, ...bytesToWords(program)], 'bech32')
    const message = 'proof of funds test'
    const first = bip322ToSpendTxidForScript(message, script)
    const second = '11'.repeat(32)
    const unsigned: Bip322Transaction = {
      version: 0,
      locktime: 0,
      inputs: [
        { txid: first, vout: 0, scriptSig: new Uint8Array(), sequence: 0, witness: [] },
        { txid: second, vout: 0, scriptSig: new Uint8Array(), sequence: 0, witness: [] },
      ],
      outputs: [{ value: 0, script: Uint8Array.from([0x6a]) }],
    }
    const scriptCode = concat(Uint8Array.from([0x76, 0xa9, 0x14]), program, Uint8Array.from([0x88, 0xac]))
    const witness0 = witnessStack([signedWitness(unsigned, 0, scriptCode, 0, secret), pubkey])
    const witness1 = witnessStack([signedWitness(unsigned, 1, scriptCode, 5000, secret), pubkey])
    const utxo0 = [...u64le(0), script.length, ...script]
    const utxo1 = [...u64le(5000), script.length, ...script]
    const psbt = Uint8Array.from([
      0x70, 0x73, 0x62, 0x74, 0xff,
      ...psbtMap([
        { key: [0x00], value: [...serializeBip322Tx(unsigned, false)] },
        { key: [0x09], value: [...new TextEncoder().encode(message)] },
      ]),
      ...psbtMap([
        { key: [0x01], value: utxo0 },
        { key: [0x08], value: [...witness0] },
      ]),
      ...psbtMap([
        { key: [0x01], value: utxo1 },
        { key: [0x08], value: [...witness1] },
      ]),
      ...psbtMap([]),
    ])
    const result = verifyBip322Full(address, message, `pof${encodeBase64(psbt)}`)
    expect(result.status, result.note).toBe('valid')
    expect(result.format).toBe('BIP-322 proof-of-funds')
    expect(result.checks.find(check => check.label === 'utxo state')?.state).toBe('unknown')
  })

  it('keeps unsupported full scripts inconclusive instead of valid', () => {
    const witnessScript = concat(Uint8Array.from([0x6a]), new TextEncoder().encode('custom'))
    const program = sha256(witnessScript)
    const addressScript = concat(Uint8Array.from([0x00, 0x20]), program)
    const address = bech32Encode('bc', [0, ...bytesToWords(program)], 'bech32')
    const tx = toSignTx(bip322ToSpendTxidForScript('custom', addressScript), new Uint8Array(), [witnessScript])
    const result = verifyBip322Full(address, 'custom', `ful${encodeBase64(serializeBip322Tx(tx))}`)
    expect(result.status).toBe('unreadable')
    expect(result.note).toMatch(/inconclusive|custom/i)
  })
})
