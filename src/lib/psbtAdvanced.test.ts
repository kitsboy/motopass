import { describe, expect, it } from 'vitest'
import { secp256k1, schnorr } from '@noble/curves/secp256k1.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { inspectPsbt } from './bitcoinInspect'

const enc = new TextEncoder()

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

function u32(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]
}

function u64(value: number): number[] {
  const out: number[] = []
  let remaining = BigInt(value)
  for (let i = 0; i < 8; i += 1) {
    out.push(Number(remaining & 0xffn))
    remaining >>= 8n
  }
  return out
}

function compactSize(value: number): number[] {
  if (value < 0xfd) return [value]
  return [0xfd, value & 0xff, value >>> 8]
}

function psbtMap(entries: Array<{ key: number[]; value: number[] }>): number[] {
  return [...entries.flatMap(entry => [entry.key.length, ...entry.key, entry.value.length, ...entry.value]), 0]
}

function base64(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes))
}

function taggedHash(tag: string, message: Uint8Array): Uint8Array {
  const tagHash = sha256(enc.encode(tag))
  return sha256(concat(tagHash, tagHash, message))
}

function hash160(bytes: Uint8Array): Uint8Array {
  return ripemd160(sha256(bytes))
}

function p2shScript(redeem: Uint8Array): Uint8Array {
  return concat(Uint8Array.from([0xa9, 0x14]), hash160(redeem), Uint8Array.from([0x87]))
}

/** Minimal 1-in/1-out transaction with no witness. */
function unsignedTx(txid: Uint8Array, scriptPubKey: Uint8Array, amount = 90_000): number[] {
  return [
    ...u32(2),
    1,
    ...txid,
    ...u32(0),
    0,
    ...[0xff, 0xff, 0xff, 0xff],
    1,
    ...u64(amount),
    ...compactSize(scriptPubKey.length),
    ...scriptPubKey,
    ...u32(0),
  ]
}

function legacySighash(tx: number[], redeem: Uint8Array, hashType = 1): Uint8Array {
  // The unsigned tx is one input/one output, so substitute the redeem script
  // in the only input's script slot and serialize the legacy preimage.
  const txid = Uint8Array.from(tx.slice(5, 37))
  const sequence = tx.slice(42, 46)
  const output = tx.slice(46, tx.length - 4)
  const locktime = tx.slice(tx.length - 4)
  const preimage = concat(
    Uint8Array.from(tx.slice(0, 4)),
    Uint8Array.from([1]),
    txid,
    Uint8Array.from([0, 0, 0, 0]),
    Uint8Array.from(compactSize(redeem.length)),
    redeem,
    Uint8Array.from(sequence),
    Uint8Array.from(output),
    Uint8Array.from(locktime),
    Uint8Array.from(u32(hashType)),
  )
  return sha256(sha256(preimage))
}

function multisigFixture(): string {
  const keys = [11, 22, 33].map(value => new Uint8Array(32).fill(value))
  const pubkeys = keys.map(key => secp256k1.getPublicKey(key, true))
  const redeem = concat(
    Uint8Array.from([0x52]),
    ...pubkeys.flatMap(pubkey => [Uint8Array.from([pubkey.length]), pubkey]),
    Uint8Array.from([0x53, 0xae]),
  )
  const script = p2shScript(redeem)
  const outScript = concat(Uint8Array.from([0x00, 0x14]), new Uint8Array(20).fill(9))
  const tx = unsignedTx(new Uint8Array(32).fill(4), outScript)
  const sighash = legacySighash(tx, redeem)
  const signatures = [keys[0], keys[2]].map(key => secp256k1.sign(sighash, key, { prehash: false, format: 'der' }))
  const witnessUtxo = [...u64(100_000), ...compactSize(script.length), ...script]
  return base64([
    0x70, 0x73, 0x62, 0x74, 0xff,
    ...psbtMap([{ key: [0x00], value: tx }]),
    ...psbtMap([
      { key: [0x01], value: witnessUtxo },
      { key: [0x04], value: Array.from(redeem) },
      { key: [0x02, ...pubkeys[0]], value: [...signatures[0], 0x01] },
      { key: [0x02, ...pubkeys[2]], value: [...signatures[1], 0x01] },
    ]),
    0x00,
  ])
}

function taprootFixture(options: { wrongLeaf?: boolean } = {}): string {
  const internalSecret = new Uint8Array(32).fill(21)
  const leafSecret = new Uint8Array(32).fill(42)
  const internal = secp256k1.getPublicKey(internalSecret, true).slice(1)
  const leafKey = secp256k1.getPublicKey(leafSecret, true).slice(1)
  const leafScript = concat(Uint8Array.from([0x20]), leafKey, Uint8Array.from([0xac]))
  const leafHash = taggedHash('TapLeaf', concat(Uint8Array.from([0xc0]), Uint8Array.from(compactSize(leafScript.length)), leafScript))
  const tweak = taggedHash('TapTweak', concat(internal, leafHash))
  const internalPoint = secp256k1.Point.fromHex(hex(concat(Uint8Array.from([0x02]), internal)))
  const outputPoint = internalPoint.add(secp256k1.Point.BASE.multiply(BigInt('0x' + hex(tweak))))
  const outputBytes = outputPoint.toBytes(true)
  const outputKey = outputBytes.slice(1)
  const scriptPubKey = concat(Uint8Array.from([0x51, 0x20]), outputKey)
  const control = concat(Uint8Array.from([0xc0 | (outputBytes[0] & 1)]), internal)
  const outScript = concat(Uint8Array.from([0x00, 0x14]), new Uint8Array(20).fill(8))
  const tx = unsignedTx(new Uint8Array(32).fill(6), outScript)
  const hashPrevouts = sha256(Uint8Array.from([...new Uint8Array(32).fill(6), ...u32(0)]))
  const hashAmounts = sha256(Uint8Array.from(u64(100_000)))
  const hashScripts = sha256(Uint8Array.from([...compactSize(scriptPubKey.length), ...scriptPubKey]))
  const hashSequences = sha256(Uint8Array.from([0xff, 0xff, 0xff, 0xff]))
  const hashOutputs = sha256(Uint8Array.from([...u64(90_000), ...compactSize(outScript.length), ...outScript]))
  const sigMsg = concat(
    Uint8Array.from([0x00, 0x00]),
    Uint8Array.from(tx.slice(0, 4)),
    Uint8Array.from([0, 0, 0, 0]),
    hashPrevouts,
    hashAmounts,
    hashScripts,
    hashSequences,
    hashOutputs,
    Uint8Array.from([0x02]),
    Uint8Array.from([0, 0, 0, 0]),
    leafHash,
    Uint8Array.from([0x00]),
    Uint8Array.from([0xff, 0xff, 0xff, 0xff]),
  )
  const sig = schnorr.sign(taggedHash('TapSighash', sigMsg), leafSecret)
  const witnessUtxo = [...u64(100_000), ...compactSize(scriptPubKey.length), ...scriptPubKey]
  const signatureLeaf = options.wrongLeaf ? new Uint8Array(32).fill(1) : leafHash
  return base64([
    0x70, 0x73, 0x62, 0x74, 0xff,
    ...psbtMap([{ key: [0x00], value: tx }]),
    ...psbtMap([
      { key: [0x01], value: witnessUtxo },
      { key: [0x15], value: [...control, ...leafScript] },
      { key: [0x13, ...leafKey, ...signatureLeaf], value: [...sig] },
    ]),
    0x00,
  ])
}

describe('advanced PSBT signatures', () => {
  it('verifies a 2-of-3 P2SH multisig with the redeem script hash bound', async () => {
    const result = await inspectPsbt(multisigFixture())
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (!result.ok) return
    expect(result.psbt.signaturesValid).toBe(2)
    expect(result.psbt.signaturesInvalid).toBe(0)
    expect(result.psbt.inputDetails[0].signatures.map(sig => sig.note).join(' ')).toContain('2-of-3')
  })

  it('rejects a P2SH redeem script that does not hash to the output', async () => {
    const raw = multisigFixture()
    const decoded = atob(raw)
    const bytes = Uint8Array.from(decoded, char => char.charCodeAt(0))
    const marker = bytes.findIndex((byte, index) => index > 40 && byte === 0x04)
    if (marker > 0) bytes[marker + 4] ^= 0x01
    const result = await inspectPsbt(btoa(String.fromCharCode(...bytes)))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.psbt.signaturesValid).toBe(0)
  })

  it('verifies a BIP-342 taproot script-path signature and control block', async () => {
    const result = await inspectPsbt(taprootFixture())
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (!result.ok) return
    expect(result.psbt.signaturesValid).toBe(1)
    expect(result.psbt.signatureChecks[0]).toMatchObject({ scheme: 'schnorr', status: 'valid' })
    expect(result.psbt.signatureChecks[0].note).toContain('script-path')
  })

  it('does not call a taproot leaf valid when the key leaf hash is wrong', async () => {
    const result = await inspectPsbt(taprootFixture({ wrongLeaf: true }))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.psbt.signaturesValid).toBe(0)
      expect(result.psbt.signatureChecks[0].status).toBe('unsupported')
    }
  })
})
