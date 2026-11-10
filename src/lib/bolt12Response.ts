import { decodeBolt12, type Bolt12Decoded } from './bolt12'

/**
 * Cross-check a BOLT12 invoice returned for a request.
 *
 * The invoice must be signed by its node key and must copy the offer fields it
 * is answering. Amounts are compared only when the offer/request fixes one.
 * The invoice request's payer key is checked for its own signature; BOLT12
 * invoices do not echo that payer key, so it is shown rather than compared to
 * the invoice signature.
 */

export interface Bolt12ResponseChecks {
  requestKind: boolean
  invoiceKind: boolean
  requestSignature: boolean
  invoiceSignature: boolean
  offerFieldsInRequest: boolean
  offerFieldsInInvoice: boolean
  amountMatches: boolean | null
  quantityMatches: boolean | null
  paymentHashPresent: boolean
  payerKeyPresent: boolean
}

export interface Bolt12ResponseResult {
  invoice: Bolt12Decoded
  checks: Bolt12ResponseChecks
  mismatches: string[]
  note: string
}

export type Bolt12ResponseVerification =
  | { ok: true; result: Bolt12ResponseResult }
  | { ok: false; error: string }

function byType(decoded: Bolt12Decoded): Map<number, string> {
  return new Map(decoded.fields.map(field => [field.type, field.hex]))
}

function compareOfferFields(offer: Bolt12Decoded, target: Bolt12Decoded): string[] {
  const source = byType(offer)
  const destination = byType(target)
  const mismatches: string[] = []
  for (const [type, hex] of source) {
    if (type >= 240) continue
    const found = destination.get(type)
    if (found == null) mismatches.push(`TLV ${type} from the offer is missing`)
    else if (found !== hex) mismatches.push(`TLV ${type} differs from the offer`)
  }
  return mismatches
}

export async function verifyBolt12InvoiceResponse(
  offerRaw: string,
  requestRaw: string,
  invoiceRaw: string,
): Promise<Bolt12ResponseVerification> {
  const offer = await decodeBolt12(offerRaw)
  if (!offer.ok) return { ok: false, error: `Offer: ${offer.error}` }
  if (offer.decoded.kind !== 'offer') return { ok: false, error: 'The first string is not a BOLT12 offer' }

  const request = await decodeBolt12(requestRaw)
  if (!request.ok) return { ok: false, error: `Request: ${request.error}` }
  if (request.decoded.kind !== 'invoice_request') {
    return { ok: false, error: 'The second string is not a BOLT12 invoice request' }
  }

  const invoice = await decodeBolt12(invoiceRaw)
  if (!invoice.ok) return { ok: false, error: `Invoice: ${invoice.error}` }
  if (invoice.decoded.kind !== 'invoice') return { ok: false, error: 'The third string is not a BOLT12 invoice' }

  const requestMismatches = compareOfferFields(offer.decoded, request.decoded)
  const invoiceMismatches = compareOfferFields(offer.decoded, invoice.decoded)
  const expectedAmount =
    request.decoded.amount ?? (offer.decoded.currency ? null : offer.decoded.amount)
  const amountMatches =
    expectedAmount == null || invoice.decoded.amount == null
      ? null
      : expectedAmount === invoice.decoded.amount

  const quantityMatches =
    offer.decoded.quantityMax == null
      ? request.decoded.quantity == null
        ? null
        : false
      : offer.decoded.quantityMax === 0
        ? request.decoded.quantity == null
        : request.decoded.quantity != null &&
          request.decoded.quantity > 0 &&
          request.decoded.quantity <= offer.decoded.quantityMax

  const mismatches = [...requestMismatches, ...invoiceMismatches]
  if (quantityMatches === false) mismatches.push('The request quantity does not fit the offer quantity terms.')
  if (amountMatches === false) {
    mismatches.push(
      `Invoice amount ${invoice.decoded.amount ?? 'missing'} does not match the request ${expectedAmount}`,
    )
  }
  if (request.decoded.signatureCheck !== 'valid') mismatches.push('The invoice request signature does not verify.')
  if (invoice.decoded.signatureCheck !== 'valid') mismatches.push('The invoice signature does not verify.')
  if (!invoice.decoded.paymentHash) mismatches.push('The invoice has no payment hash.')

  return {
    ok: true,
    result: {
      invoice: invoice.decoded,
      checks: {
        requestKind: request.decoded.kind === 'invoice_request',
        invoiceKind: invoice.decoded.kind === 'invoice',
        requestSignature: request.decoded.signatureCheck === 'valid',
        invoiceSignature: invoice.decoded.signatureCheck === 'valid',
        offerFieldsInRequest: requestMismatches.length === 0,
        offerFieldsInInvoice: invoiceMismatches.length === 0,
        amountMatches,
        quantityMatches,
        paymentHashPresent: Boolean(invoice.decoded.paymentHash),
        payerKeyPresent: Boolean(request.decoded.payerId),
      },
      mismatches,
      note: 'The invoice is signed by its node key. The payer key belongs to the request; BOLT12 invoices do not echo it, so it cannot be compared to the invoice signer. Quantity is checked on the request because the merged invoice fields do not repeat it.',
    },
  }
}
