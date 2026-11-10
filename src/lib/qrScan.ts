/**
 * Normalize text from a QR code before it reaches a verifier.
 *
 * Wallet QRs may wrap a BOLT11 invoice in `lightning:` or an address in a
 * BIP-21 `bitcoin:` URI. Strip only the transport wrapper and a BIP-21 query;
 * never rewrite the signed artifact itself.
 */
export function cleanScannedText(raw: string): string {
  let value = raw.trim()
  if (/^lightning:/i.test(value)) value = value.slice('lightning:'.length)
  if (/^bitcoin:/i.test(value)) value = value.slice('bitcoin:'.length).split('?')[0]
  return value.trim()
}
