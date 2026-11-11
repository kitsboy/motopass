import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Link2 } from 'lucide-react'
import { verifyPaymentEvidence, type PaymentEvidenceOutcome } from '../../lib/paymentEvidence'
import { ClearButton, FieldRow, ToolCard, VerificationTrail, buttonClass, inputClass } from './toolsShared'

const STATE_LABEL = (value: boolean | null): 'pass' | 'fail' | 'unknown' =>
  value == null ? 'unknown' : value ? 'pass' : 'fail'

export function PaymentEvidenceCard() {
  const [invoice, setInvoice] = useState('')
  const [preimage, setPreimage] = useState('')
  const [zapReceipt, setZapReceipt] = useState('')
  const [messageAddress, setMessageAddress] = useState('')
  const [messageText, setMessageText] = useState('')
  const [messageSignature, setMessageSignature] = useState('')
  const [expectedRecipient, setExpectedRecipient] = useState('')
  const [expectedAmount, setExpectedAmount] = useState('')
  const [expectedPurpose, setExpectedPurpose] = useState('')
  const [result, setResult] = useState<PaymentEvidenceOutcome | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    setResult(
      await verifyPaymentEvidence({
        invoice,
        preimage,
        zapReceipt,
        signedMessageAddress: messageAddress,
        signedMessageText: messageText,
        signedMessageSignature: messageSignature,
        expectedRecipient,
        expectedAmount,
        expectedPurpose,
      }),
    )
    setBusy(false)
  }

  const checks = result?.ok
    ? [
        { label: 'invoice format', state: STATE_LABEL(result.checks.invoice) },
        { label: 'payment hash', state: STATE_LABEL(result.checks.paymentHash) },
        { label: 'preimage', state: STATE_LABEL(result.checks.preimage) },
        { label: 'zap receipt', state: STATE_LABEL(result.checks.zapReceipt) },
        { label: 'zap ↔ invoice', state: STATE_LABEL(result.checks.zapInvoice) },
        { label: 'zap amount', state: STATE_LABEL(result.checks.zapAmount) },
        { label: 'signed message', state: STATE_LABEL(result.checks.signedMessage) },
        { label: 'message ↔ hash', state: STATE_LABEL(result.checks.messageHash) },
        { label: 'message binding', state: STATE_LABEL(result.checks.messageBinding) },
      ]
    : []

  return (
    <ToolCard icon={<Link2 size={11} aria-hidden="true" />} eyebrow="EVIDENCE BUNDLE" title="Cross-check a payment claim" toolId="payment-evidence">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Check whether an invoice, preimage, zap receipt and signed message agree with each other. A coherent bundle is
        still not proof of payment, and it does not prove what the payment was for.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="evidence-invoice" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          BOLT11 invoice (required)
        </label>
        <textarea
          id="evidence-invoice"
          value={invoice}
          onChange={event => setInvoice(event.target.value)}
          rows={3}
          spellCheck={false}
          placeholder="lnbc…"
          className={inputClass}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label htmlFor="evidence-preimage" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              Preimage (optional)
            </label>
            <input
              id="evidence-preimage"
              value={preimage}
              onChange={event => setPreimage(event.target.value)}
              spellCheck={false}
              placeholder="64 hex characters"
              className={inputClass}
            />
          </div>
          <div className="sm:row-span-2">
            <label htmlFor="evidence-zap" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              Zap receipt JSON (optional)
            </label>
            <textarea
              id="evidence-zap"
              value={zapReceipt}
              onChange={event => setZapReceipt(event.target.value)}
              rows={4}
              spellCheck={false}
              placeholder='{"kind":9735,…}'
              className={`${inputClass} font-mono text-[10px]`}
            />
          </div>
        </div>

        <details className="mt-2 rounded-mp-md border border-mp-border-subtle p-2">
          <summary className="min-h-9 cursor-pointer font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">
            Signed message (optional)
          </summary>
          <label htmlFor="evidence-address" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
            Payment bundle address
          </label>
          <input
            id="evidence-address"
            value={messageAddress}
            onChange={event => setMessageAddress(event.target.value)}
            spellCheck={false}
            placeholder="bc1… / 1… / 3…"
            className={inputClass}
          />
          <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
            Expected bindings are optional. Each value you supply must appear verbatim in the signed message; the
            reader does not infer a merchant, amount or purpose.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label htmlFor="evidence-expected-recipient" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
                Expected recipient
              </label>
              <input
                id="evidence-expected-recipient"
                value={expectedRecipient}
                onChange={event => setExpectedRecipient(event.target.value)}
                placeholder="merchant or address"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="evidence-expected-amount" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
                Expected amount
              </label>
              <input
                id="evidence-expected-amount"
                value={expectedAmount}
                onChange={event => setExpectedAmount(event.target.value)}
                placeholder="250000000 msat"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="evidence-expected-purpose" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
                Expected purpose
              </label>
              <input
                id="evidence-expected-purpose"
                value={expectedPurpose}
                onChange={event => setExpectedPurpose(event.target.value)}
                placeholder="residency fee"
                className={inputClass}
              />
            </div>
          </div>
          <label htmlFor="evidence-message" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
            Exact message (must contain the payment hash and expected bindings)
          </label>
          <textarea
            id="evidence-message"
            value={messageText}
            onChange={event => setMessageText(event.target.value)}
            rows={2}
            spellCheck={false}
            className={inputClass}
          />
          <label htmlFor="evidence-signature" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
            Signature
          </label>
          <textarea
            id="evidence-signature"
            value={messageSignature}
            onChange={event => setMessageSignature(event.target.value)}
            rows={2}
            spellCheck={false}
            className={`${inputClass} font-mono text-[10px]`}
          />
        </details>

        <button type="submit" disabled={busy || !invoice.trim()} className={`${buttonClass} mt-2`}>
          {busy ? 'Cross-checking…' : 'Cross-check bundle'}
        </button>
        <ClearButton
          onClick={() => {
            setInvoice('')
            setPreimage('')
            setZapReceipt('')
            setMessageAddress('')
            setMessageText('')
            setMessageSignature('')
            setExpectedRecipient('')
            setExpectedAmount('')
            setExpectedPurpose('')
            setResult(null)
          }}
          disabled={!invoice && !preimage && !zapReceipt && !messageAddress && !messageText && !messageSignature && !expectedRecipient && !expectedAmount && !expectedPurpose && !result}
        />
      </form>

      <div aria-live="polite" className="mt-3">
        {result && !result.ok && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {result.error}
          </p>
        )}
        {result?.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <VerificationTrail
              steps={checks}
              tool="payment-evidence"
              title="Payment evidence bundle"
              limits={[
                'A matching preimage proves the hash relation; it does not prove who paid or what the invoice was for.',
                'A zap receipt is signed by a node or recipient key, not by the payer; its presence does not prove settlement.',
                'A signed message proves control of an address key, not funds or current ownership. Expected bindings check string presence, not that the merchant or purpose is real.',
                'This reader does not query the chain, a node or a relay. The invoice must still be checked with the payee.',
              ]}
              fields={{
                paymentHash: result.invoice.paymentHash,
                amountMsat: result.invoice.amountMsat,
                preimage: result.details.preimage,
                zapRecipient: result.details.zapRecipient,
                zapSender: result.details.zapSender,
                messageFormat: result.details.messageFormat,
                messageAddress: result.details.messageAddress,
                messageBinding: result.details.messageBinding,
                verdict: result.verdict,
              }}
            />
            <p
              className={`flex items-center gap-1 text-[11px] font-semibold ${
                result.verdict === 'failed'
                  ? 'text-mp-wax'
                  : result.verdict === 'consistent'
                    ? 'text-mp-proof'
                    : 'text-mp-ink-secondary'
              }`}
            >
              {result.verdict === 'failed' ? (
                <AlertTriangle size={11} aria-hidden="true" />
              ) : (
                <CheckCircle2 size={11} aria-hidden="true" />
              )}
              {result.verdict === 'failed'
                ? 'The bundle has a broken link'
                : result.verdict === 'consistent'
                  ? 'Supplied artifacts are internally consistent'
                  : 'Invoice only · incomplete evidence'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-mp-ink-tertiary">{result.note}</p>
            <div className="mt-1.5">
              <FieldRow label="Payment hash" value={<span className="font-mono text-[10px]">{result.invoice.paymentHash ?? 'not present'}</span>} />
              <FieldRow label="Amount" value={result.invoice.amountMsat == null ? 'open invoice' : `${result.invoice.amountMsat.toLocaleString('en-US')} msat`} />
              {result.details.zapRecipient && <FieldRow label="Zap recipient" value={<span className="break-all font-mono text-[10px]">{result.details.zapRecipient}</span>} />}
              {result.details.messageAddress && <FieldRow label="Message address" value={result.details.messageAddress} />}
              {result.details.messageBinding != null && (
                <FieldRow label="Message binding" value={result.details.messageBinding ? 'all expected values present' : 'a supplied value is missing'} />
              )}
            </div>
            {result.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-mp-wax">
                {result.warnings.map(warning => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
              “Consistent” only means the supplied fields agree. It is not proof of payment, settlement or the purpose of
              the invoice.
            </p>
          </div>
        )}
      </div>
    </ToolCard>
  )
}
