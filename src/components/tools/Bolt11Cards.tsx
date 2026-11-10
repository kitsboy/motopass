import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ScanLine, ShieldCheck } from 'lucide-react'
import { bolt11AmountSats, bolt11ExpiryLabel, decodeBolt11 } from '../../lib/bolt11'
import { verifyBolt11Signature } from '../../lib/bolt11Signature'
import { formatSatsExact } from '../../lib/satsAnchor'
import { ClearButton, FieldRow, ToolCard, VerificationTrail, buttonClass, inputClass, useToolIntake } from './toolsShared'
import { QrScanButton } from './QrScanner'

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

function bolt11AmountLabel(amountMsat: number | null): string {
  if (amountMsat == null) return 'open — no amount in the invoice'
  const sats = bolt11AmountSats(amountMsat)
  if (sats == null) return `${amountMsat.toLocaleString('en-US')} msat (not a whole number of sats)`
  return formatSatsExact(sats)
}

function Bolt11Tool() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<ReturnType<typeof decodeBolt11> | null>(null)
  const [decodedAt, setDecodedAt] = useState<number | null>(null)

  useToolIntake('bolt11', setRaw)

  const run = () => {
    setResult(decodeBolt11(raw))
    setDecodedAt(nowSeconds())
  }

  return (
    <ToolCard
      icon={<ScanLine size={11} aria-hidden="true" />}
      eyebrow="BOLT11"
      title="Read an invoice" toolId="bolt11"
    >
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Amount, expiry, payment hash and description. The bech32 checksum is checked here; use the signature verifier
        below to recover the payee key. A decode is not a payment guarantee.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          run()
        }}
      >
        <label htmlFor="bolt11-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Invoice
        </label>
        <textarea
          id="bolt11-input"
          value={raw}
          onChange={event => setRaw(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) run()
          }}
          rows={3}
          spellCheck={false}
          placeholder="lnbc…"
          className={inputClass}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={!raw.trim()} className={buttonClass}>
            Decode invoice
          </button>
          <QrScanButton onScan={setRaw} />
        </div>
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
                { label: 'checksum', state: 'pass' },
                { label: 'payee key', state: result.invoice.payeeNodeKey ? 'unknown' : 'unknown' },
                { label: 'payment', state: 'unknown' },
              ]}
              tool="bolt11"
              title="BOLT11 invoice decode"
              limits={[
                'The bech32 checksum is checked; this card does not verify the ECDSA signature.',
                'A decoded invoice is not proof that it is payable or paid.',
                'The expiry is read from the invoice, not from a node.',
              ]}
              fields={{ network: result.invoice.network, paymentHash: result.invoice.paymentHash, payee: result.invoice.payeeNodeKey }}
            />
            <p className="flex items-center gap-1 text-[10px] font-semibold text-mp-proof">
              <CheckCircle2 size={11} aria-hidden="true" /> Checksum valid · decoded locally
            </p>
            <div className="mt-1.5">
              <FieldRow label="Network" value={result.invoice.network} />
              <FieldRow
                label="Amount"
                value={bolt11AmountLabel(result.invoice.amountMsat)}
              />
              <FieldRow
                label="Created"
                value={`${new Date(result.invoice.timestamp * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC`}
              />
              <FieldRow
                label="Expiry"
                value={decodedAt == null ? '—' : bolt11ExpiryLabel(result.invoice.expiresAt, decodedAt)}
              />
              <FieldRow
                label="Payment hash"
                value={<span className="font-mono text-[10px]">{result.invoice.paymentHash ?? 'not present'}</span>}
              />
              <FieldRow label="Description" value={result.invoice.description ?? 'not present'} />
              {result.invoice.descriptionHash && (
                <FieldRow
                  label="Description hash"
                  value={<span className="font-mono text-[10px]">{result.invoice.descriptionHash}</span>}
                />
              )}
              <FieldRow
                label="Payee key"
                value={<span className="font-mono text-[10px]">{result.invoice.payeeNodeKey ?? 'not present'}</span>}
              />
              <FieldRow label="Route hints" value={result.invoice.routeHintCount} />
            </div>
            {result.invoice.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-mp-wax">
                {result.invoice.warnings.map(warning => (
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

function Bolt11SignatureTool() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyBolt11Signature>> | null>(null)
  const [busy, setBusy] = useState(false)

  useToolIntake('bolt11-signature', setRaw)

  const run = async () => {
    setBusy(true)
    setResult(await verifyBolt11Signature(raw))
    setBusy(false)
  }

  const tone =
    result?.status === 'valid'
      ? 'text-mp-proof'
      : result?.status === 'invalid' || result?.status === 'unreadable'
        ? 'text-mp-wax'
        : 'text-mp-ink-tertiary'

  return (
    <ToolCard icon={<ShieldCheck size={11} aria-hidden="true" />} eyebrow="BOLT11" title="Verify the payee key" toolId="bolt11-signature">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Recovers the ECDSA public key from the invoice signature and compares it with the <span className="font-mono">n</span>{' '}
        field. A mismatch means the invoice was edited or signed by a different key.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="bolt11-signature-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Invoice
        </label>
        <textarea
          id="bolt11-signature-input"
          value={raw}
          onChange={event => setRaw(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void run()
          }}
          rows={3}
          spellCheck={false}
          placeholder="lnbc…"
          className={inputClass}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={busy || !raw.trim()} className={buttonClass}>
            {busy ? 'Recovering…' : 'Verify signature'}
          </button>
          <QrScanButton onScan={setRaw} />
          <ClearButton
            onClick={() => {
              setRaw('')
              setResult(null)
            }}
            disabled={!raw && !result}
          />
        </div>
      </form>
      <div aria-live="polite" className="mt-3">
        {result && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <p className={`text-[10px] font-semibold ${tone}`}>
              {result.status === 'valid'
                ? 'Signature verifies against the n field'
                : result.status === 'invalid'
                  ? 'Signature does not match the n field'
                  : result.status === 'recovered'
                    ? 'Key recovered · no n field to compare'
                    : 'Signature could not be read'}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-mp-ink-tertiary">{result.note}</p>
            {result.recoveredKey && (
              <div className="mt-1.5">
                <FieldRow
                  label="Recovered"
                  value={<span className="font-mono text-[10px]">{result.recoveredKey}</span>}
                  copy={result.recoveredKey}
                />
                {result.statedKey && (
                  <FieldRow
                    label="Stated n"
                    value={<span className="font-mono text-[10px]">{result.statedKey}</span>}
                    copy={result.statedKey}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolCard>
  )
}

export { Bolt11Tool, Bolt11SignatureTool }
