import { verifyBip322Simple, type Bip322Check } from './bip322'
import { verifyMessageSignature, type MessageSignatureResult } from './messageSignature'

/**
 * Signed-message dispatcher.
 *
 * BIP-322 prefixed simple signatures and unprefixed witness stacks go to the
 * BIP-322 reader. A 65-byte compact signature with a BIP-137 header stays with
 * the legacy reader. Full/proof-of-funds BIP-322 is surfaced as unsupported,
 * never silently treated as a legacy signature.
 */

export type SignedMessageFormat = 'BIP-137' | 'BIP-322 simple' | 'BIP-322 full' | null

export interface SignedMessageResult {
  status: 'valid' | 'invalid' | 'unreadable'
  format: SignedMessageFormat
  addressType: string | null
  recoveredPubkey: string | null
  recoveredAddress: string | null
  checks: Bip322Check[]
  note: string
  limits: string[]
}

const BIP137_LIMITS = [
  'Legacy message signing proves control of the key at signing time; it does not prove funds, balance or current ownership.',
  'The exact message matters. Whitespace, Unicode normalisation or a different line ending changes the digest.',
  'BIP-137 covers P2PKH, P2SH-P2WPKH and P2WPKH only; use BIP-322 for taproot and native segwit proofs.',
  'A signed message can be replayed wherever it is accepted; this card does not check the relying party or context.',
]

function asBip322(result: ReturnType<typeof verifyBip322Simple>): SignedMessageResult {
  return {
    status: result.status,
    format: result.format,
    addressType: result.addressType,
    recoveredPubkey: result.recoveredPubkey,
    recoveredAddress: result.recoveredAddress,
    checks: result.checks,
    note: result.note,
    limits: result.limits,
  }
}

function fromBip137(result: MessageSignatureResult): SignedMessageResult {
  const checks: Bip322Check[] = [
    { label: 'format', state: result.status === 'unreadable' ? 'unknown' : 'pass' },
    {
      label: 'key recovery',
      state: result.status === 'unreadable' ? 'unknown' : result.recoveredPubkey ? 'pass' : 'fail',
    },
    {
      label: 'address match',
      state: result.status === 'valid' ? 'pass' : result.status === 'invalid' ? 'fail' : 'unknown',
    },
    { label: 'replay context', state: 'unknown' },
  ]
  return {
    status: result.status,
    format: result.status === 'unreadable' ? null : 'BIP-137',
    addressType: result.addressType,
    recoveredPubkey: result.recoveredPubkey,
    recoveredAddress: result.recoveredAddress,
    checks,
    note: result.note,
    limits: BIP137_LIMITS,
  }
}

function decodeBase64Length(value: string): number | null {
  try {
    return atob(value.replace(/\s+/g, '')).length
  } catch {
    return null
  }
}

export function verifySignedMessage(
  addressInput: string,
  message: string,
  signatureInput: string,
): SignedMessageResult {
  const signature = signatureInput.trim()
  const prefix = signature.slice(0, 3).toLowerCase()

  if (prefix === 'smp') return asBip322(verifyBip322Simple(addressInput, message, signature))
  if (prefix === 'ful' || prefix === 'pof') {
    return {
      status: 'unreadable',
      format: prefix === 'ful' ? 'BIP-322 full' : null,
      addressType: null,
      recoveredPubkey: null,
      recoveredAddress: null,
      checks: [],
      note:
        prefix === 'ful'
          ? 'BIP-322 full signatures carry a whole transaction and are not supported by this reader. Only BIP-322 simple P2WPKH/P2TR proofs are checked.'
          : 'BIP-322 proof-of-funds signatures need a PSBT and UTXO verifier and are not supported by this reader.',
      limits: BIP322_FULL_LIMITS,
    }
  }

  const length = decodeBase64Length(signature)
  if (length === 65) return fromBip137(verifyMessageSignature(addressInput, message, signature))

  // BIP-322 implementations before the final prefix requirement produced bare
  // witness stacks. Try simple first, then let BIP-137 explain malformed input.
  const bip322 = verifyBip322Simple(addressInput, message, signature)
  if (bip322.status !== 'unreadable') return asBip322(bip322)
  return fromBip137(verifyMessageSignature(addressInput, message, signature))
}

const BIP322_FULL_LIMITS = [
  'This reader verifies BIP-322 simple only: native P2WPKH and single-key P2TR.',
  'Full BIP-322 proofs can express timelocks and arbitrary scripts, so they need a full script interpreter and are reported as unchecked.',
  'A valid proof would show control of the address key at signing time, not funds, balance or a payment.',
]
