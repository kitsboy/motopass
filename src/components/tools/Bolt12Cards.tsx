import { useState } from 'react'
import { AlertTriangle, CheckCircle2, FileKey2 } from 'lucide-react'
import { buildBolt12InvoiceRequest } from '../../lib/bolt12Request'
import { decodeBolt12, type Bolt12Decoded } from '../../lib/bolt12'
import { verifyBolt12InvoiceResponse } from '../../lib/bolt12Response'
import { formatSatsExact } from '../../lib/satsAnchor'
import { CheckLine, ClearButton, FieldRow, ToolCard, VerificationTrail, buttonClass, inputClass } from './toolsShared'

const SIGNATURE_TONE: Record<Bolt12Decoded['signatureCheck'], string> = {
  valid: 'text-mp-proof',
  invalid: 'text-mp-wax',
  unsigned: 'text-mp-ink-tertiary',
  unavailable: 'text-mp-ink-tertiary',
}

const SIGNATURE_LABEL: Record<Bolt12Decoded['signatureCheck'], string> = {
  valid: 'Signature verifies',
  invalid: 'Signature does not verify',
  unsigned: 'Unsigned by design',
  unavailable: 'No signature check possible',
}


function Bolt12Tool() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof decodeBolt12>> | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    setResult(await decodeBolt12(raw))
    setBusy(false)
  }

  return (
    <ToolCard
      icon={<FileKey2 size={11} aria-hidden="true" />}
      eyebrow="BOLT12"
      title="Read an offer or check a signature" toolId="bolt12"
    >
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Offers (<span className="font-mono">lno1…</span>) are decoded — and they are <strong>not signed</strong> in
        BOLT12. Invoice requests (<span className="font-mono">lnr1…</span>) and invoices (
        <span className="font-mono">lni1…</span>) carry a BIP-340 signature, checked here against the Merkle root.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="bolt12-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          BOLT12 string
        </label>
        <textarea
          id="bolt12-input"
          value={raw}
          onChange={event => setRaw(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void run()
          }}
          rows={3}
          spellCheck={false}
          placeholder="lno1… or lnr1…"
          className={inputClass}
        />
        <button type="submit" disabled={busy || !raw.trim()} className={`${buttonClass} mt-2`}>
          {busy ? 'Reading…' : 'Read BOLT12'}
        </button>
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
              steps={[
                { label: 'format', state: 'pass' },
                {
                  label: 'signature',
                  state:
                    result.decoded.signatureCheck === 'valid'
                      ? 'pass'
                      : result.decoded.signatureCheck === 'invalid'
                        ? 'fail'
                        : 'unknown',
                },
                { label: 'payment', state: 'unknown' },
              ]}
              tool="bolt12"
              title="BOLT12 message check"
              limits={[
                'Offers are unsigned by BOLT12 design; only requests and invoices carry signatures.',
                'Recurrence is not in the merged BOLT12 specification and is not interpreted.',
                'A valid message signature does not prove a payment was made.',
              ]}
              fields={{ kind: result.decoded.kind, signature: result.decoded.signatureCheck, nodeId: result.decoded.nodeId }}
            />
            <p className={`text-[10px] font-semibold ${SIGNATURE_TONE[result.decoded.signatureCheck]}`}>
              {SIGNATURE_LABEL[result.decoded.signatureCheck]}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-mp-ink-tertiary">{result.decoded.signatureNote}</p>
            <div className="mt-1.5">
              <FieldRow label="Form" value={result.decoded.kind.replace('_', ' ')} />
              <FieldRow label="Description" value={result.decoded.description ?? 'not present'} />
              <FieldRow
                label="Amount"
                value={
                  result.decoded.amount == null
                    ? 'not present'
                    : result.decoded.amountUnit === 'currency-minor'
                      ? `${result.decoded.amount.toLocaleString('en-US')} ${result.decoded.currency ?? ''} minor units`
                      : result.decoded.amount % 1000 === 0
                        ? `${formatSatsExact(result.decoded.amount / 1000)} (${result.decoded.amount.toLocaleString('en-US')} msat)`
                        : `${result.decoded.amount.toLocaleString('en-US')} msat (not a whole number of sats)`
                }
              />
              <FieldRow label="Quantity max" value={result.decoded.quantityMax ?? 'not present'} />
              <FieldRow label="Quantity in request" value={result.decoded.quantity ?? 'not present'} />
              <FieldRow
                label="Issuer"
                value={result.decoded.issuer ?? 'not present'}
              />
              <FieldRow
                label="Node id"
                value={<span className="font-mono text-[10px]">{result.decoded.nodeId ?? 'not present'}</span>}
              />
              {result.decoded.signature && (
                <FieldRow
                  label="Signature"
                  value={<span className="font-mono text-[10px]">{result.decoded.signature}</span>}
                />
              )}
              {result.decoded.merkleRoot && (
                <FieldRow
                  label="Merkle root"
                  value={<span className="font-mono text-[10px]">{result.decoded.merkleRoot}</span>}
                />
              )}
              <FieldRow label="TLV fields" value={result.decoded.fields.map(field => field.type).join(' · ')} />
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-mp-ink-tertiary">{result.decoded.recurrenceNote}</p>
            {result.decoded.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-mp-wax">
                {result.decoded.warnings.map(warning => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </ToolCard>
  )
}

function Bolt12RequestTool() {
  const [offer, setOffer] = useState('')
  const [sats, setSats] = useState('')
  const [note, setNote] = useState('')
  const [quantity, setQuantity] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof buildBolt12InvoiceRequest>> | null>(null)
  const [returned, setReturned] = useState('')
  const [response, setResponse] = useState<Awaited<ReturnType<typeof verifyBolt12InvoiceResponse>> | null>(null)
  const [busy, setBusy] = useState(false)
  const [verifyBusy, setVerifyBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    setResponse(null)
    const amount = sats.trim() ? Number(sats) : null
    const parsedQuantity = quantity.trim() ? Number(quantity) : null
    setResult(await buildBolt12InvoiceRequest(offer, { amountSats: amount, payerNote: note, quantity: parsedQuantity }))
    setBusy(false)
  }

  const verify = async () => {
    if (!result?.ok) return
    setVerifyBusy(true)
    setResponse(await verifyBolt12InvoiceResponse(offer, result.request, returned))
    setVerifyBusy(false)
  }

  return (
    <ToolCard icon={<FileKey2 size={11} aria-hidden="true" />} eyebrow="BOLT12" title="Build an invoice request" toolId="bolt12-request">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Generates a fresh payer key in this tab, copies the offer fields, and signs a real{' '}
        <span className="font-mono">lnr1…</span> request. The private key is discarded, not stored or sent.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="bolt12-offer-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Offer
        </label>
        <textarea
          id="bolt12-offer-input"
          value={offer}
          onChange={event => setOffer(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void run()
          }}
          rows={3}
          spellCheck={false}
          placeholder="lno1…"
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="bolt12-amount" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              Amount (sats, optional)
            </label>
            <input
              id="bolt12-amount"
              value={sats}
              onChange={event => setSats(event.target.value)}
              inputMode="numeric"
              placeholder="open offer"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bolt12-quantity" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              Quantity (optional)
            </label>
            <input
              id="bolt12-quantity"
              value={quantity}
              onChange={event => setQuantity(event.target.value)}
              inputMode="numeric"
              placeholder="1"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bolt12-note" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              Payer note (optional)
            </label>
            <input
              id="bolt12-note"
              value={note}
              onChange={event => setNote(event.target.value)}
              maxLength={512}
              placeholder="public to the issuer"
              className={inputClass}
            />
          </div>
        </div>
        <button type="submit" disabled={busy || !offer.trim()} className={`${buttonClass} mt-2`}>
          {busy ? 'Signing…' : 'Build request'}
        </button>
        <ClearButton
          onClick={() => {
            setOffer('')
            setSats('')
            setNote('')
            setQuantity('')
            setResult(null)
            setReturned('')
            setResponse(null)
          }}
          disabled={!offer && !sats && !note && !result && !returned}
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
            <p className="flex items-center gap-1 text-[10px] font-semibold text-mp-proof">
              <CheckCircle2 size={11} aria-hidden="true" /> Signed locally · ready for the issuer
            </p>
            <textarea
              readOnly
              value={result.request}
              rows={4}
              aria-label="Generated BOLT12 invoice request"
              className={`${inputClass} font-mono text-[9px]`}
            />
            <div className="mt-1.5">
              <FieldRow
                label="Payer id"
                value={<span className="font-mono text-[10px]">{result.payerId}</span>}
                copy={result.payerId}
              />
              <FieldRow
                label="Amount"
                value={result.amountMsat == null ? 'open' : `${result.amountMsat.toLocaleString('en-US')} msat`}
              />
              <FieldRow label="Quantity" value={quantity.trim() || (result.request ? 'see request' : 'not set')} />
              <FieldRow
                label="Merkle root"
                value={<span className="font-mono text-[10px]">{result.merkleRoot}</span>}
                copy={result.merkleRoot}
              />
            </div>
            <p className="mt-1 text-[9px] leading-relaxed text-mp-ink-tertiary">
              This request is a message, not a payment. It has not been sent to the issuer.
            </p>
            <div className="mt-3 border-t border-mp-border-subtle/60 pt-2">
              <label htmlFor="bolt12-returned" className="block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
                Returned invoice (optional)
              </label>
              <textarea
                id="bolt12-returned"
                value={returned}
                onChange={event => setReturned(event.target.value)}
                rows={3}
                spellCheck={false}
                placeholder="lni1… from the issuer"
                className={`${inputClass} font-mono text-[9px]`}
              />
              <button
                type="button"
                onClick={() => void verify()}
                disabled={verifyBusy || !returned.trim()}
                className={`${buttonClass} mt-2`}
              >
                {verifyBusy ? 'Verifying…' : 'Verify response'}
              </button>
              {response && !response.ok && (
                <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-mp-wax">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {response.error}
                </p>
              )}
              {response?.ok && (
                <div className="mt-2 rounded-mp-md border border-mp-border-subtle p-2">
                  <VerificationTrail
                    steps={[
                      { label: 'request sig', state: response.result.checks.requestSignature ? 'pass' : 'fail' },
                      { label: 'invoice sig', state: response.result.checks.invoiceSignature ? 'pass' : 'fail' },
                      { label: 'amount / quantity', state: response.result.checks.amountMatches === true && response.result.checks.quantityMatches !== false ? 'pass' : 'fail' },
                      { label: 'paid', state: 'unknown' },
                    ]}
                    tool="bolt12-response"
                    title="BOLT12 request and invoice response"
                    limits={[
                      'The invoice does not echo the payer key, so it cannot be compared to the invoice signer.',
                      'Quantity is checked on the request; the merged invoice fields do not repeat it.',
                      'A valid invoice signature does not prove settlement.',
                    ]}
                    fields={{ nodeId: response.result.invoice.nodeId, amountMsat: response.result.invoice.amount }}
                  />
                  <CheckLine label="Request kind" value={response.result.checks.requestKind} />
                  <CheckLine label="Invoice kind" value={response.result.checks.invoiceKind} />
                  <CheckLine label="Request signature" value={response.result.checks.requestSignature} />
                  <CheckLine label="Invoice signature" value={response.result.checks.invoiceSignature} />
                  <CheckLine label="Offer fields in request" value={response.result.checks.offerFieldsInRequest} />
                  <CheckLine label="Offer fields in invoice" value={response.result.checks.offerFieldsInInvoice} />
                  <CheckLine label="Amount matches" value={response.result.checks.amountMatches} />
                  <CheckLine label="Quantity matches" value={response.result.checks.quantityMatches} />
                  <CheckLine label="Payment hash present" value={response.result.checks.paymentHashPresent} />
                  <CheckLine label="Payer key present" value={response.result.checks.payerKeyPresent} />
                  <div className="mt-1.5">
                    <FieldRow
                      label="Node id"
                      value={<span className="font-mono text-[10px]">{response.result.invoice.nodeId ?? 'not present'}</span>}
                    />
                    <FieldRow
                      label="Invoice amount"
                      value={
                        response.result.invoice.amount == null
                          ? 'not present'
                          : `${response.result.invoice.amount.toLocaleString('en-US')} msat`
                      }
                    />
                    <FieldRow
                      label="Payment hash"
                      value={<span className="font-mono text-[10px]">{response.result.invoice.paymentHash ?? 'not present'}</span>}
                      copy={response.result.invoice.paymentHash ?? undefined}
                    />
                  </div>
                  {response.result.mismatches.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-mp-wax">
                      {response.result.mismatches.map(mismatch => (
                        <li key={mismatch}>{mismatch}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-[9px] leading-relaxed text-mp-ink-tertiary">{response.result.note}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

export { Bolt12Tool, Bolt12RequestTool }
