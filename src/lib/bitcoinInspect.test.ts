import { describe, expect, it } from 'vitest'
import { inspectAddress, inspectPsbt } from './bitcoinInspect'

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
  const tx = [
    ...u32(2),
    1,
    ...new Array(32).fill(0),
    ...u32(0),
    0,
    ...[0xff, 0xff, 0xff, 0xff],
    1,
    ...u64(4000),
    0,
    ...u32(0),
  ]
  const witnessUtxo = [...u64(5000), 0]
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

describe('inspectPsbt', () => {
  it('reads a minimal PSBT and computes its fee from witness UTXOs', () => {
    const result = inspectPsbt(psbtFixture())
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (result.ok) {
      expect(result.psbt.version).toBe(2)
      expect(result.psbt.inputs).toBe(1)
      expect(result.psbt.outputs).toBe(1)
      expect(result.psbt.inputSats).toBe(5000)
      expect(result.psbt.outputSats).toBe(4000)
      expect(result.psbt.feeSats).toBe(1000)
    }
  })

  it('rejects a non-PSBT and a truncated map', () => {
    expect(inspectPsbt('%%%%')).toEqual({ ok: false, error: 'Not valid base64 or hex' })
    expect(inspectPsbt('70736274ff00')).toMatchObject({ ok: false })
  })
})
