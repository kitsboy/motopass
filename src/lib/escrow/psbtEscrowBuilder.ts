import type { DistressedListing } from '../../types/distressedListing'

export interface EscrowBuildResult {
  psbt_base64: string
  policy: 'template_only' | 'arbiter_active'
  seal_proof_url: string
  warnings: string[]
}

/** Signet PSBT template stub — no funds until BUILD 32 legal sign-off */
export function buildEscrowPsbtStub(listing: DistressedListing): EscrowBuildResult {
  const stub = btoa(
    JSON.stringify({
      version: '2of3_v1',
      network: 'signet',
      amount_sats: Math.round((listing.ask_usd / 65_000) * 1e8),
      listing_id: listing.listing_id,
      proof_url: listing.proof_url,
      policy: listing.escrow_policy,
    }),
  )
  return {
    psbt_base64: stub,
    policy: listing.escrow_policy,
    seal_proof_url: listing.proof_url,
    warnings: [
      'TEMPLATE ONLY — no funds move on this stub',
      'Full 2-of-3 PSBT builder ships BUILD 31+ after legal sign-off',
    ],
  }
}