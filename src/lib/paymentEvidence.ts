import { decodeBolt11, type Bolt11Invoice } from './bolt11'
import { checkPreimage } from './preimage'
import { verifySignedMessage } from './signedMessage'
import { verifyZapReceipt } from './zapReceipt'

/**
 * Cross-check a payment claim as one evidence bundle.
 *
 * Every input is optional except the invoice. A pass means the supplied
 * artifacts agree with each other; it does not prove a payment occurred, who
 * paid, or that the invoice was for the claimed purpose.
 */

export type EvidenceState = boolean | null

export interface PaymentEvidenceChecks {
  invoice: boolean | null
  paymentHash: boolean | null
  preimage: boolean | null
  zapReceipt: boolean | null
  zapInvoice: boolean | null
  zapAmount: boolean | null
  signedMessage: boolean | null
  messageHash: boolean | null
  messageBinding: boolean | null
}

export type EvidenceVerdict = 'consistent' | 'incomplete' | 'failed'

export interface PaymentEvidenceResult {
  ok: true
  invoice: Bolt11Invoice
  checks: PaymentEvidenceChecks
  verdict: EvidenceVerdict
  note: string
  warnings: string[]
  details: {
    preimage: string | null
    zapRecipient: string | null
    zapSender: string | null
    messageFormat: string | null
    messageAddress: string | null
    messageBinding: boolean | null
  }
}

export type PaymentEvidenceOutcome =
  | PaymentEvidenceResult
  | { ok: false; error: string }

export interface PaymentEvidenceInput {
  invoice: string
  preimage?: string
  zapReceipt?: string
  signedMessageAddress?: string
  signedMessageText?: string
  signedMessageSignature?: string
  expectedRecipient?: string
  expectedAmount?: string
  expectedPurpose?: string
}

export interface PaymentExpectations {
  recipient?: string
  amount?: string
  purpose?: string
}

/** Return the expected bindings that do not appear verbatim in the message. */
export function missingMessageBindings(message: string, expected: PaymentExpectations): string[] {
  const haystack = message.toLowerCase()
  return (['recipient', 'amount', 'purpose'] as const).filter(key => {
    const value = expected[key]?.trim()
    return Boolean(value && !haystack.includes(value.toLowerCase()))
  })
}

function supplied(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

export async function verifyPaymentEvidence(input: PaymentEvidenceInput): Promise<PaymentEvidenceOutcome> {
  const decoded = decodeBolt11(input.invoice)
  if (!decoded.ok) return { ok: false, error: decoded.error }
  const invoice = decoded.invoice
  const paymentHash = invoice.paymentHash
  const warnings = [...invoice.warnings]
  const checks: PaymentEvidenceChecks = {
    invoice: true,
    paymentHash: Boolean(paymentHash),
    preimage: null,
    zapReceipt: null,
    zapInvoice: null,
    zapAmount: null,
    signedMessage: null,
    messageHash: null,
    messageBinding: null,
  }
  const details: PaymentEvidenceResult['details'] = {
    preimage: input.preimage?.trim().toLowerCase() || null,
    zapRecipient: null,
    zapSender: null,
    messageFormat: null,
    messageAddress: null,
    messageBinding: null,
  }
  const expected: PaymentExpectations = {
    recipient: input.expectedRecipient,
    amount: input.expectedAmount,
    purpose: input.expectedPurpose,
  }
  const expectedCount = Object.values(expected).filter(value => value?.trim()).length

  if (!paymentHash) warnings.push('The invoice has no payment hash, so nothing can be cross-linked to it.')

  if (supplied(input.preimage) && paymentHash) {
    const relation = await checkPreimage(input.preimage!.trim(), paymentHash)
    checks.preimage = relation === 'match' ? true : relation === 'mismatch' ? false : null
    if (relation !== 'match') warnings.push('The supplied preimage does not hash to the invoice payment hash.')
  }

  if (supplied(input.zapReceipt)) {
    const zap = await verifyZapReceipt(input.zapReceipt!)
    if (!zap.ok) {
      checks.zapReceipt = false
      warnings.push(`Zap receipt: ${zap.error}`)
    } else {
      details.zapRecipient = zap.details.recipient
      details.zapSender = zap.details.sender
      checks.zapReceipt =
        zap.checks.receiptSignature &&
        zap.checks.invoiceDecoded &&
        zap.checks.amountMatches !== false &&
        zap.checks.recipientMatches !== false &&
        zap.checks.eventMatches !== false &&
        zap.checks.preimage !== 'mismatch'
      if (!checks.zapReceipt) warnings.push('The zap receipt does not pass its own signature or tag checks.')
      const zapHash = zap.details.invoiceDetails?.paymentHash ?? null
      checks.zapInvoice = paymentHash && zapHash ? paymentHash === zapHash : null
      if (checks.zapInvoice === false) warnings.push('The zap receipt references a different invoice payment hash.')
      const zapAmount = zap.details.invoiceAmountMsat
      checks.zapAmount = invoice.amountMsat != null && zapAmount != null ? invoice.amountMsat === zapAmount : null
      if (checks.zapAmount === false) warnings.push('The zap receipt amount differs from the supplied invoice.')
      warnings.push(...zap.warnings)
    }
  }

  const hasSigner = [input.signedMessageAddress, input.signedMessageText, input.signedMessageSignature].some(supplied)
  if (hasSigner) {
    const address = input.signedMessageAddress?.trim() ?? ''
    const message = input.signedMessageText ?? ''
    const signature = input.signedMessageSignature?.trim() ?? ''
    if (!address || !signature) {
      checks.signedMessage = null
      checks.messageHash = null
      warnings.push('A signed-message check needs the address and signature (and the exact message, which may be empty).')
    } else {
      const signed = verifySignedMessage(address, message, signature)
      details.messageFormat = signed.format
      details.messageAddress = address
      checks.signedMessage = signed.status === 'valid' ? true : signed.status === 'invalid' ? false : null
      if (signed.status !== 'valid') warnings.push(`Signed message: ${signed.note}`)
      if (paymentHash) {
        checks.messageHash = message.toLowerCase().includes(paymentHash.toLowerCase())
        if (!checks.messageHash) warnings.push('The signed message does not contain the invoice payment hash, so it is not bound to this invoice.')
      }
      if (expectedCount > 0) {
        const missing = missingMessageBindings(message, expected)
        checks.messageBinding = missing.length === 0
        details.messageBinding = checks.messageBinding
        if (missing.length) {
          warnings.push(`The signed message is missing the expected ${missing.join(', ')} binding${missing.length === 1 ? '' : 's'}.`)
        }
      }
    }
  } else if (expectedCount > 0) {
    warnings.push('Expected recipient, amount or purpose was supplied, but no signed message was available to bind it.')
  }

  const suppliedChecks = Object.entries(checks).filter(
    ([key, value]) => key !== 'invoice' && key !== 'paymentHash' && value !== null,
  )
  const hasFailure = Object.values(checks).some(value => value === false)
  const hasSupplemental = suppliedChecks.length > 0
  const verdict: EvidenceVerdict = hasFailure ? 'failed' : hasSupplemental ? 'consistent' : 'incomplete'
  const note =
    verdict === 'failed'
      ? 'At least one supplied artifact does not agree with the invoice. Do not treat the bundle as evidence until the failed link is resolved.'
      : verdict === 'consistent'
        ? 'The supplied artifacts agree with each other. This is internal consistency, not proof that a payment occurred.'
        : 'The invoice is readable, but no preimage, zap receipt or signed message was supplied. Add one to cross-check it.'

  return {
    ok: true,
    invoice,
    checks,
    verdict,
    note,
    warnings: Array.from(new Set(warnings)),
    details,
  }
}
