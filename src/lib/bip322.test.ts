import { describe, expect, it } from 'vitest'
import { bytesToHex } from './bech32'
import { bip322MessageHash, bip322ToSpendTxid, verifyBip322Simple } from './bip322'

/** Published BIP-322 basic vectors. */
const P2WPKH = {
  address: 'bc1q9vza2e8x573nczrlzms0wvx3gsqjx7vavgkx0l',
  message: 'Hello World',
  signature:
    'smpAkcwRAIgZRfIY3p7/DoVTty6YZbWS71bc5Vct9p9Fia83eRmw2QCICK/ENGfwLtptFluMGs2KsqoNSk89pO7F29zJLUx9a/sASECx/EgAxlkQpQ9hYjgGu6EBCPMVPwVIVJqO4XCsMvViHI=',
}

const TAPROOT = {
  address: 'bc1pss0zhytly75awhm6x2hhvd5lnzv3vssgrf9axfheq8ldyzn88ges79fler',
  message: 'No prefix fallback',
  signature: 'AUCJYOwOjxYAvatTAGYaVlNXBVyFuc4MwNQkOuK2tl8xhfKDONd0NjfYyNSYcRqeCp8hsAnCEPHAVEkO9h6vbQ/R',
}

describe('BIP-322 simple signed messages', () => {
  it('matches the published message hash and to_spend txid vectors', () => {
    expect(bytesToHex(bip322MessageHash(''))).toBe(
      'c90c269c4f8fcbe6880f72a721ddfbf1914268a794cbb21cfafee13770ae19f1',
    )
    expect(bip322ToSpendTxid('', P2WPKH.address)).toBe(
      'c5680aa69bb8d860bf82d4e9cd3504b55dde018de765a91bb566283c545a99a7',
    )
    expect(bip322ToSpendTxid('Hello World', P2WPKH.address)).toBe(
      'b79d196740ad5217771c1098fc4a4b51e0535c32236c71f1ea4d61a2d603352b',
    )
  })

  it('verifies the published P2WPKH simple vector', () => {
    const result = verifyBip322Simple(P2WPKH.address, P2WPKH.message, P2WPKH.signature)
    expect(result.status, result.note).toBe('valid')
    expect(result.addressType).toBe('P2WPKH')
    expect(result.format).toBe('BIP-322 simple')
    expect(result.recoveredPubkey).toMatch(/^02|03/)
  })

  it('verifies an unprefixed taproot simple proof', () => {
    const result = verifyBip322Simple(TAPROOT.address, TAPROOT.message, TAPROOT.signature)
    expect(result.status, result.note).toBe('valid')
    expect(result.addressType).toBe('P2TR')
    expect(result.recoveredPubkey).toHaveLength(64)
  })

  it('rejects the right signature for a changed message or address', () => {
    expect(verifyBip322Simple(P2WPKH.address, `${P2WPKH.message}!`, P2WPKH.signature).status).toBe('invalid')
    expect(
      verifyBip322Simple('bc1q9vza2e8x573nczrlzms0wvx3gsqjx7vavgkx0l', P2WPKH.message, P2WPKH.signature).status,
    ).toBe('valid')
    expect(
      verifyBip322Simple('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', P2WPKH.message, P2WPKH.signature).status,
    ).toBe('invalid')
  })

  it('labels full/proof-of-funds and unsupported scripts instead of guessing', () => {
    expect(verifyBip322Simple(P2WPKH.address, 'x', 'fulAAAA').status).toBe('unreadable')
    expect(verifyBip322Simple(P2WPKH.address, 'x', 'pofAAAA').status).toBe('unreadable')
    expect(
      verifyBip322Simple('bc1qp0ahvfh83088w49k405szqgg4f3pptr7p2g06tdxfjcd40z4lh4q95lsz9', 'x', 'smpAA==').status,
    ).toBe('unreadable')
  })
})
