import { describe, expect, it } from 'vitest'
import { decodeSilentPaymentAddress, deriveSilentPaymentOutput } from './silentPayments'

/** BIP-352 test vector: "Simple send: two inputs". */
const ADDRESS =
  'sp1qqgste7k9hx0qftg6qmwlkqtwuy6cycyavzmzj85c6qdfhjdpdjtdgqjuexzk6murw56suy3e0rd2cgqvycxttddwsvgxe2usfpxumr70xc9pkqwv'
const SCAN = '0220bcfac5b99e04ad1a06ddfb016ee13582609d60b6291e98d01a9bc9a16c96d4'
const SPEND = '025cc9856d6f8375350e123978daac200c260cb5b5ae83106cab90484dcd8fcf36'
const INPUT_KEY_SUM = '7ed265a6dac7aba8508a32d6d6b84c7f1dbd0a0941dd01088d69e8d556345f86'

describe('decodeSilentPaymentAddress', () => {
  it('decodes the BIP-352 scan and spend keys', () => {
    const result = decodeSilentPaymentAddress(ADDRESS)
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (!result.ok) return
    expect(result.address.network).toBe('bitcoin')
    expect(result.address.version).toBe(0)
    expect(result.address.scanPubkey).toBe(SCAN)
    expect(result.address.spendPubkey).toBe(SPEND)
  })

  it('rejects a normal bech32 address, a bad checksum and a testnet key mix', () => {
    expect(decodeSilentPaymentAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toMatchObject({ ok: false })
    expect(decodeSilentPaymentAddress(`${ADDRESS.slice(0, -1)}q`)).toMatchObject({ ok: false })
    expect(decodeSilentPaymentAddress(ADDRESS.toUpperCase())).toMatchObject({
      ok: true,
      address: { address: ADDRESS },
    })
  })
})

describe('deriveSilentPaymentOutput', () => {
  it('reproduces the BIP-352 sender output and P2TR script', async () => {
    const result = await deriveSilentPaymentOutput({
      address: ADDRESS,
      inputPrivateKey: INPUT_KEY_SUM,
      txid: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16',
      vout: 0,
    })
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (!result.ok) return
    expect(result.xOnlyPubkey).toBe('3e9fce73d4e77a4809908e3c3a2e54ee147b9312dc5044a193d1fc85de46e3c1')
    expect(result.scriptPubKey).toBe('51203e9fce73d4e77a4809908e3c3a2e54ee147b9312dc5044a193d1fc85de46e3c1')
    expect(result.address.startsWith('bc1p')).toBe(true)
  })

  it('changes the output when the outpoint or k changes', async () => {
    const base = {
      address: ADDRESS,
      inputPrivateKey: INPUT_KEY_SUM,
      txid: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16',
      vout: 0,
    }
    const first = await deriveSilentPaymentOutput(base)
    const second = await deriveSilentPaymentOutput({ ...base, k: 1 })
    const third = await deriveSilentPaymentOutput({ ...base, vout: 1 })
    if (!first.ok || !second.ok || !third.ok) throw new Error('derivation failed')
    expect(second.xOnlyPubkey).not.toBe(first.xOnlyPubkey)
    expect(third.xOnlyPubkey).not.toBe(first.xOnlyPubkey)
  })

  it('rejects malformed keys and addresses without guessing', async () => {
    expect(
      await deriveSilentPaymentOutput({
        address: ADDRESS,
        inputPrivateKey: '00',
        txid: '00'.repeat(32),
        vout: 0,
      }),
    ).toMatchObject({ ok: false })
    expect(
      await deriveSilentPaymentOutput({
        address: 'sp1bad',
        inputPrivateKey: INPUT_KEY_SUM,
        txid: '00'.repeat(32),
        vout: 0,
      }),
    ).toMatchObject({ ok: false })
  })
})
