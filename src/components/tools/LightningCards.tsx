import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Globe2, Wallet, Zap } from 'lucide-react'
import { bolt11AmountSats } from '../../lib/bolt11'
import { checkPreimage, type PreimageCheck } from '../../lib/preimage'
import { inspectLnurlPay, requestAndInspectLnurlInvoice } from '../../lib/lnurlInspect'
import { formatSatsExact } from '../../lib/satsAnchor'
import { verifyZapReceipt } from '../../lib/zapReceipt'
import { CheckLine, ClearButton, FieldRow, ToolCard, buttonClass, inputClass, useToolIntake } from './toolsShared'

function bolt11AmountLabel(amountMsat: number | null): string {
  if (amountMsat == null) return 'open — no amount in the invoice'
  const sats = bolt11AmountSats(amountMsat)
  if (sats == null) return `${amountMsat.toLocaleString('en-US')} msat (not a whole number of sats)`
  return formatSatsExact(sats)
}

function PreimageTool() {
  const [preimage, setPreimage] = useState('')
  const [paymentHash, setPaymentHash] = useState('')
  const [result, setResult] = useState<PreimageCheck | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    setResult(await checkPreimage(preimage, paymentHash))
    setBusy(false)
  }

  return (
    <ToolCard icon={<Wallet size={11} aria-hidden="true" />} eyebrow="SHA-256" title="Check a preimage" toolId="preimage">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        The one Lightning relation that needs no node: <span className="font-mono">sha256(preimage)</span> must equal
        the payment hash. It does not prove who paid or what the invoice was for.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="preimage-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Preimage (32-byte hex)
        </label>
        <input
          id="preimage-input"
          value={preimage}
          onChange={event => setPreimage(event.target.value)}
          spellCheck={false}
          placeholder="64 hex characters"
          className={inputClass}
        />
        <label htmlFor="hash-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Payment hash
        </label>
        <input
          id="hash-input"
          value={paymentHash}
          onChange={event => setPaymentHash(event.target.value)}
          spellCheck={false}
          placeholder="64 hex characters"
          className={inputClass}
        />
        <button type="submit" disabled={busy || !preimage.trim() || !paymentHash.trim()} className={`${buttonClass} mt-2`}>
          {busy ? 'Hashing…' : 'Check locally'}
        </button>
      </form>
      <div aria-live="polite" className="mt-3 text-[11px] leading-relaxed">
        {result === 'match' && <p className="text-mp-proof">The preimage hashes to this payment hash.</p>}
        {result === 'mismatch' && <p className="text-mp-wax">The preimage does not hash to this payment hash.</p>}
        {result === 'unreadable' && result != null && (
          <p className="text-mp-ink-tertiary">Both values must be 64 hex characters and WebCrypto must be available.</p>
        )}
      </div>
    </ToolCard>
  )
}

function LnurlTool() {
  const [raw, setRaw] = useState('')
  const [sats, setSats] = useState('5000')
  const [inspection, setInspection] = useState<Awaited<ReturnType<typeof inspectLnurlPay>> | null>(null)
  const [invoice, setInvoice] = useState<Awaited<ReturnType<typeof requestAndInspectLnurlInvoice>> | null>(null)
  const [busy, setBusy] = useState(false)

  useToolIntake('lnurl', setRaw)

  const inspect = async () => {
    setBusy(true)
    setInvoice(null)
    setInspection(await inspectLnurlPay(raw))
    setBusy(false)
  }

  const request = async () => {
    const amount = Number(sats)
    setBusy(true)
    setInvoice(await requestAndInspectLnurlInvoice(raw, Number.isSafeInteger(amount) ? amount : 0))
    setBusy(false)
  }

  return (
    <ToolCard icon={<Globe2 size={11} aria-hidden="true" />} eyebrow="LUD-16 / LUD-01" title="Inspect LNURL-pay" toolId="lnurl" network>
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Reads a Lightning Address or <span className="font-mono">lnurl1…</span> string, then makes one https request to
        the pay endpoint. A browser CORS refusal is shown as a failure.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void inspect()
        }}
      >
        <label htmlFor="lnurl-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Lightning Address or LNURL
        </label>
        <input
          id="lnurl-input"
          value={raw}
          onChange={event => setRaw(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void inspect()
          }}
          spellCheck={false}
          placeholder="name@domain or lnurl1…"
          className={inputClass}
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="lnurl-amount" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              Amount (sats)
            </label>
            <input
              id="lnurl-amount"
              value={sats}
              onChange={event => setSats(event.target.value)}
              inputMode="numeric"
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={busy || !raw.trim()} className={`${buttonClass} mb-0.5`}>
            {busy ? 'Reading…' : 'Inspect'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => void request()}
          disabled={busy || !inspection?.ok || !raw.trim()}
          className={`${buttonClass} mt-2`}
        >
          Request invoice
        </button>
        <ClearButton
          onClick={() => {
            setRaw('')
            setInspection(null)
            setInvoice(null)
          }}
          disabled={!raw && !inspection && !invoice}
        />
      </form>
      <div aria-live="polite" className="mt-3">
        {inspection && !inspection.ok && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {inspection.error}
          </p>
        )}
        {inspection?.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <p className="text-[10px] font-semibold text-mp-proof">Pay endpoint responded</p>
            <p className="mt-0.5 break-all font-mono text-[10px] text-mp-ink-tertiary">{inspection.inspection.target.endpoint}</p>
            <div className="mt-1.5">
              <FieldRow label="Kind" value={inspection.inspection.target.kind} />
              <FieldRow
                label="Range"
                value={`${Math.floor(inspection.inspection.params.minSendable / 1000).toLocaleString('en-US')} – ${Math.floor(inspection.inspection.params.maxSendable / 1000).toLocaleString('en-US')} sats`}
              />
              <FieldRow label="Comment" value={inspection.inspection.params.commentAllowed} />
              {inspection.inspection.metadata.map((entry, index) => (
                <FieldRow key={`${entry.type}-${index}`} label={entry.type} value={entry.value} />
              ))}
            </div>
          </div>
        )}
        {invoice && !invoice.ok && (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {invoice.error}
          </p>
        )}
        {invoice?.ok && (
          <div className="mt-2 rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-mp-proof">
              <CheckCircle2 size={11} aria-hidden="true" /> Invoice decoded locally
            </p>
            <div className="mt-1.5">
              <FieldRow
                label="Amount"
                value={bolt11AmountLabel(invoice.result.decoded.amountMsat)}
              />
              <FieldRow
                label="Amount check"
                value={invoice.result.paymentHashMatchesAmount ? 'matches the request' : 'does not match the request'}
              />
              <FieldRow
                label="Payment hash"
                value={<span className="font-mono text-[10px]">{invoice.result.decoded.paymentHash ?? 'not present'}</span>}
                copy={invoice.result.decoded.paymentHash ?? undefined}
              />
              <FieldRow label="Description" value={invoice.result.decoded.description ?? 'not present'} />
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

function ZapReceiptTool() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyZapReceipt>> | null>(null)
  const [busy, setBusy] = useState(false)

  useToolIntake('zap', setRaw)

  const run = async () => {
    setBusy(true)
    setResult(await verifyZapReceipt(raw))
    setBusy(false)
  }

  return (
    <ToolCard icon={<Zap size={11} aria-hidden="true" />} eyebrow="NIP-57" title="Verify a zap receipt" toolId="zap">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Checks the kind 9735 signature, the embedded zap request, the BOLT11 invoice and the matching tags. It does not
        prove the zap was paid unless a valid preimage is present.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="zap-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Zap receipt JSON
        </label>
        <textarea
          id="zap-input"
          value={raw}
          onChange={event => setRaw(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void run()
          }}
          rows={4}
          spellCheck={false}
          placeholder='{"kind":9735,…}'
          className={inputClass}
        />
        <button type="submit" disabled={busy || !raw.trim()} className={`${buttonClass} mt-2`}>
          {busy ? 'Checking…' : 'Verify receipt'}
        </button>
        <ClearButton
          onClick={() => {
            setRaw('')
            setResult(null)
          }}
          disabled={!raw && !result}
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
            <CheckLine label="Receipt signature" value={result.checks.receiptSignature} />
            <CheckLine label="Zap request signature" value={result.checks.zapRequestSignature} />
            <CheckLine label="Invoice decoded" value={result.checks.invoiceDecoded} />
            <CheckLine label="Amounts match" value={result.checks.amountMatches} />
            <CheckLine label="Recipient matches" value={result.checks.recipientMatches} />
            <CheckLine label="Event matches" value={result.checks.eventMatches} />
            <CheckLine
              label="Preimage"
              value={result.checks.preimage == null ? null : result.checks.preimage === 'match'}
            />
            <div className="mt-1.5">
              <FieldRow
                label="Recipient"
                value={<span className="font-mono text-[10px]">{result.details.recipient ?? 'not tagged'}</span>}
                copy={result.details.recipient ?? undefined}
              />
              <FieldRow
                label="Amount"
                value={result.details.invoiceAmountMsat == null ? 'not present' : `${result.details.invoiceAmountMsat.toLocaleString('en-US')} msat`}
              />
              <FieldRow label="Zap sender" value={<span className="font-mono text-[10px]">{result.details.sender ?? 'not present'}</span>} />
              <FieldRow
                label="Payment hash"
                value={<span className="font-mono text-[10px]">{result.details.invoiceDetails?.paymentHash ?? 'not present'}</span>}
                copy={result.details.invoiceDetails?.paymentHash ?? undefined}
              />
              <FieldRow label="Published" value={new Date(result.details.createdAt * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'} />
            </div>
            {result.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-mp-wax">
                {result.warnings.map(warning => (
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

export { PreimageTool, LnurlTool, ZapReceiptTool }
