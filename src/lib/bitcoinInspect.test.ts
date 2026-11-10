import { describe, expect, it } from 'vitest'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { inspectAddress, inspectPsbt, scriptToAddress } from './bitcoinInspect'

function hexBytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g)?.map(byte => Number.parseInt(byte, 16)) ?? [])
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

function psbtMap(entries: Array<{ key: number[]; value: number[] }>): number[] {
  return [...entries.flatMap(entry => [entry.key.length, ...entry.key, entry.value.length, ...entry.value]), 0]
}

/** BIP-143 P2WPKH example, with a real signature over its published sighash. */
function signedP2wpkhFixture(): string {
  const privateKey = hexBytes('619c335025c7f4012e556c2a58b2506e30b8511b53ade95ea316fd8c3286feb9')
  const pubkey = hexBytes('025476c2e83188368da1ff3e292e7acafcdb3566bb0ad253f62fc70f07aeee6357')
  const sighash = hexBytes('c37af31116d1b27caf68aae9e3ac82f1477929014d5b917657d0eb49478cb670')
  const signature = secp256k1.sign(sighash, privateKey, { prehash: false, format: 'der' })
  const p2pkhScript = hexBytes('76a91419c2f3ae0ca3b642bd3e49598b8da89f50c1416188ac')
  const p2wpkhScript = hexBytes('00141d0f172a0ecb48aee1be1f2687d2963ae33f71a1')
  const out1 = hexBytes('76a9148280b37df378db99f66f85c95a783a76ac7a6d5988ac')
  const out2 = hexBytes('76a9143bde42dbee7e4dbe6a21b2d50ce2f0167faa815988ac')
  const txid1 = hexBytes('9f96ade4b41d5433f4eda31e1738ec2b36f6e7d1420d94a6af99801a88f7f7ff').reverse()
  const txid2 = hexBytes('8ac60eb9575db5b2d987e29f301b5b819ea83a5c6579d282d189cc04b8e151ef').reverse()
  const tx = [
    ...u32(1),
    2,
    ...txid1, ...u32(0), 0, 0xee, 0xff, 0xff, 0xff,
    ...txid2, ...u32(1), 0, 0xff, 0xff, 0xff, 0xff,
    2,
    ...u64(112_340_000), out1.length, ...out1,
    ...u64(223_450_000), out2.length, ...out2,
    ...u32(17),
  ]
  const witness1 = [...u64(625_000_000), p2pkhScript.length, ...p2pkhScript]
  const witness2 = [...u64(600_000_000), p2wpkhScript.length, ...p2wpkhScript]
  const bytes = [
    0x70, 0x73, 0x62, 0x74, 0xff,
    ...psbtMap([{ key: [0x00], value: tx }]),
    ...psbtMap([{ key: [0x01], value: witness1 }]),
    ...psbtMap([
      { key: [0x01], value: witness2 },
      { key: [0x02, ...pubkey], value: [...signature, 0x01] },
    ]),
    0x00,
    0x00,
  ]
  return btoa(String.fromCharCode(...bytes))
}

function psbtFixture(): string {
  const u32 = (value: number) => [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]
  const u64 = (value: number) => {
    const out: number[] = []
    let remaining = BigInt(value)
    for (let i = 0; i < 8; i += 1) {
      out.push(Number(remaining & 0xffn))
      remaining >>= 8n
    }
    return out
  }
  const script = [0x00, 0x14, ...new Array(20).fill(1)]
  const tx = [
    ...u32(2),
    1,
    ...new Array(32).fill(0),
    ...u32(0),
    0,
    ...[0xff, 0xff, 0xff, 0xff],
    1,
    ...u64(4000),
    script.length,
    ...script,
    ...u32(0),
  ]
  const witnessUtxo = [...u64(5000), script.length, ...script]
  const bytes = [
    0x70, 0x73, 0x62, 0x74, 0xff,
    0x01, 0x00, tx.length, ...tx,
    0x00,
    0x01, 0x01, witnessUtxo.length, ...witnessUtxo,
    0x00,
    0x00,
  ]
  return btoa(String.fromCharCode(...bytes))
}

describe('inspectAddress', () => {
  it('decodes a P2WPKH bech32 address and builds its script', async () => {
    const result = await inspectAddress('BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4')
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (result.ok) {
      expect(result.address.type).toBe('P2WPKH')
      expect(result.address.scriptPubKey).toBe('0014751e76e8199196d454941c45d1b3a323f1433bd6')
    }
  })

  it('decodes a P2TR bech32m address', async () => {
    const result = await inspectAddress('bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297')
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (result.ok) {
      expect(result.address.type).toBe('P2TR')
      expect(result.address.scriptPubKey.startsWith('5120')).toBe(true)
    }
  })

  it('decodes a Base58Check P2PKH address and rejects a broken checksum', async () => {
    const result = await inspectAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (result.ok) expect(result.address.type).toBe('P2PKH')
    expect(await inspectAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN3')).toMatchObject({ ok: false })
  })
})

describe('scriptToAddress', () => {
  it('round-trips a P2WPKH script into a bech32 address', async () => {
    const script = Uint8Array.from([0x00, 0x14, ...new Uint8Array(20).fill(1)])
    const result = await scriptToAddress(script)
    expect(result?.type).toBe('P2WPKH')
    expect(result?.address.startsWith('bc1q')).toBe(true)
    if (result) {
      const decoded = await inspectAddress(result.address)
      expect(decoded.ok).toBe(true)
      if (decoded.ok) expect(decoded.address.scriptPubKey).toBe('0014' + '01'.repeat(20))
    }
  })
})

describe('inspectPsbt', () => {
  it('reads a minimal PSBT, derives input/output addresses and computes its fee', async () => {
    const result = await inspectPsbt(psbtFixture())
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (result.ok) {
      expect(result.psbt.version).toBe(2)
      expect(result.psbt.inputs).toBe(1)
      expect(result.psbt.outputs).toBe(1)
      expect(result.psbt.inputSats).toBe(5000)
      expect(result.psbt.outputSats).toBe(4000)
      expect(result.psbt.feeSats).toBe(1000)
      expect(result.psbt.outputDetails[0].scriptType).toBe('P2WPKH')
      expect(result.psbt.outputDetails[0].address).toMatch(/^bc1q/)
      expect(result.psbt.inputDetails[0].scriptType).toBe('P2WPKH')
      expect(result.psbt.inputDetails[0].address).toMatch(/^bc1q/)
      expect(result.psbt.inputDetails[0].prevTxid).toHaveLength(64)
      expect(result.psbt.outputDetails[0].possibleChange).toBe(true)
      expect(result.psbt.outputDetails[0].addressReuse).toBe(true)
    }
  })

  it('verifies a real P2WPKH signature against the BIP-143 sighash', async () => {
    const result = await inspectPsbt(signedP2wpkhFixture())
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (!result.ok) return
    expect(result.psbt.signaturesValid).toBe(1)
    expect(result.psbt.signaturesInvalid).toBe(0)
    expect(result.psbt.signatureChecks[0]).toMatchObject({ input: 1, scheme: 'ecdsa', status: 'valid' })
    expect(result.psbt.inputDetails[1].signatures[0].note).toContain('BIP-143')
  })

  it('flags an edited P2WPKH signature as invalid', async () => {
    const raw = signedP2wpkhFixture()
    const decoded = atob(raw)
    const bytes = Uint8Array.from(decoded, char => char.charCodeAt(0))
    const marker = bytes.findIndex((byte, index) => index > 30 && byte === 0x30)
    if (marker > 0) bytes[marker + 5] ^= 0x01
    const edited = btoa(String.fromCharCode(...bytes))
    const result = await inspectPsbt(edited)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.psbt.signaturesInvalid).toBe(1)
  })

  it('rejects a non-PSBT and a truncated map', async () => {
    expect(await inspectPsbt('%%%%')).toEqual({ ok: false, error: 'Not valid base64 or hex' })
    expect(await inspectPsbt('70736274ff00')).toMatchObject({ ok: false })
  })
})
