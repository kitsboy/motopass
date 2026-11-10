import { describe, expect, it } from 'vitest'
import { verifyMessageSignature } from './messageSignature'

/**
 * Published Bitcoin Core functional-test vector
 * (test/functional/rpc_signmessagewithprivkey.py):
 * WIF cUeKHd5orzT3mz8P9pxyREHfsWtVfgsfDjiZZBcjUBAaGk1BTj7N,
 * testnet P2PKH mpLQjfK79b7CCV4VMJWEWAj5Mpx8Up5zxB.
 */
const CORE = {
  address: 'mpLQjfK79b7CCV4VMJWEWAj5Mpx8Up5zxB',
  message: 'This is just a test message',
  signature: 'INbVnW4e6PeRmsv2Qgu8NuopvrVjkcxob+sX8OcZG0SALhWybUjzMLPdAsXI46YZGb0KQTRii+wWIQzRpG/U+S0=',
}

describe('BIP-137 signed messages', () => {
  it('verifies the published Bitcoin Core vector against its advertised address', () => {
    const result = verifyMessageSignature(CORE.address, CORE.message, CORE.signature)
    expect(result.status).toBe('valid')
    expect(result.addressType).toBe('P2PKH')
    expect(result.recoveredPubkey).toMatch(/^02|03/)
    expect(result.recoveredAddress).toBe(CORE.address)
  })

  it('rejects a changed message and a different address', () => {
    const changed = verifyMessageSignature(CORE.address, `${CORE.message}!`, CORE.signature)
    const wrongAddress = verifyMessageSignature(
      '1HZwkjkeaoZfTSaJxDw6aKkxp45agDiEzN',
      CORE.message,
      CORE.signature,
    )
    expect(changed.status).toBe('invalid')
    expect(wrongAddress.status).toBe('invalid')
  })

  it('rejects malformed signatures and unsupported address types', () => {
    expect(verifyMessageSignature(CORE.address, CORE.message, 'not-base64').status).toBe('unreadable')
    expect(verifyMessageSignature('bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297', CORE.message, CORE.signature).status).toBe('unreadable')
  })
})
