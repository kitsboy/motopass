import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileKey2,
  Globe2,
  Landmark,
  Receipt,
  ScanLine,
  BadgeCheck,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { ReceiptInspector } from '../components/lightning/ReceiptInspector'
import { decodeBolt11, bolt11AmountSats, bolt11ExpiryLabel } from '../lib/bolt11'
import { verifyBolt11Signature } from '../lib/bolt11Signature'
import { decodeBolt12, type Bolt12Decoded } from '../lib/bolt12'
import { buildBolt12InvoiceRequest } from '../lib/bolt12Request'
import { verifyBolt12InvoiceResponse } from '../lib/bolt12Response'
import { inspectBitcoinInput } from '../lib/bitcoinInspect'
import { nip05Verdict, resolveNip05 } from '../lib/nip05'
import { forgetNip05Pin, recordNip05Pin, type Nip05PinRecord } from '../lib/nip05Pin'
import { inspectNip17GiftWrap } from '../lib/nip17'
import { decodeSilentPaymentAddress, deriveSilentPaymentOutput } from '../lib/silentPayments'
import { decode as decodeNip19, npubEncode } from 'nostr-tools/nip19'
import { checkPreimage, type PreimageCheck } from '../lib/preimage'
import { inspectLnurlPay, requestAndInspectLnurlInvoice } from '../lib/lnurlInspect'
import { formatSatsExact } from '../lib/satsAnchor'
import { verifyZapReceipt } from '../lib/zapReceipt'

/**
 * Bitcoin / Lightning readers that run entirely in this tab.
 *
 * All readers run in this tab except the LNURL resolver and NIP-05 lookup, which
 * each make one https request only after the visitor presses Inspect. That limits what they can say:
 * BOLT11 can be decoded and its payee key recovered, a BOLT12 offer is
 * structurally read and is unsigned by design, and a receipt is checked for its
 * signature and preimage relation only. The copy on each card states the limit
 * instead of implying a payment was proven.
 */

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

function bolt11AmountLabel(amountMsat: number | null): string {
  if (amountMsat == null) return 'open — no amount in the invoice'
  const sats = bolt11AmountSats(amountMsat)
  if (sats == null) return `${amountMsat.toLocaleString('en-US')} msat (not a whole number of sats)`
  return formatSatsExact(sats)
}

const BITCOIN_TOOLS = [
  { id: 'bolt11', href: '#bolt11', label: 'BOLT11 invoice', network: false, group: 'invoice' },
  { id: 'bolt11-signature', href: '#bolt11-signature', label: 'BOLT11 signature', network: false, group: 'invoice' },
  { id: 'bolt12', href: '#bolt12', label: 'BOLT12 message', network: false, group: 'offer' },
  { id: 'bolt12-request', href: '#bolt12-request', label: 'BOLT12 request', network: false, group: 'offer' },
  { id: 'preimage', href: '#preimage', label: 'Preimage check', network: false, group: 'lightning' },
  { id: 'receipt', href: '#receipt', label: 'Receipt verify', network: false, group: 'lightning' },
  { id: 'lnurl', href: '#lnurl', label: 'LNURL inspect', network: true, group: 'lightning' },
  { id: 'zap', href: '#zap', label: 'Zap receipt', network: false, group: 'nostr' },
  { id: 'nip05', href: '#nip05', label: 'NIP-05 lookup', network: true, group: 'nostr' },
  { id: 'nip17', href: '#nip17', label: 'NIP-17 DM', network: false, group: 'nostr' },
  { id: 'address-psbt', href: '#address-psbt', label: 'Address / PSBT', network: false, group: 'bitcoin' },
  { id: 'silent-payments', href: '#silent-payments', label: 'Silent Payments', network: false, group: 'bitcoin' },
] as const

const GUIDE: Array<{ id: (typeof BITCOIN_TOOLS)[number]['id']; label: string; hint: string }> = [
  { id: 'bolt11', label: 'An invoice', hint: 'BOLT11 amount, expiry, payee key' },
  { id: 'bolt12', label: 'An offer or request', hint: 'BOLT12 TLV and signatures' },
  { id: 'address-psbt', label: 'A PSBT or address', hint: 'Scripts, coin control, signatures' },
  { id: 'silent-payments', label: 'A Silent Payment', hint: 'sp1 address and one output' },
  { id: 'nip17', label: 'A Nostr DM', hint: 'Gift wrap, seal and rumor' },
  { id: 'nip05', label: 'A NIP-05 name', hint: 'Domain mapping and continuity' },
]

type TrailState = 'pass' | 'fail' | 'unknown'

function VerificationTrail({ steps }: { steps: Array<{ label: string; state: TrailState }> }) {
  const tone: Record<TrailState, string> = {
    pass: 'border-mp-proof-border text-mp-proof',
    fail: 'border-mp-wax/40 text-mp-wax',
    unknown: 'border-mp-border-subtle text-mp-ink-tertiary',
  }
  return (
    <div className="mb-2 flex flex-wrap gap-1" aria-label="Verification trail">
      {steps.map((step, index) => (
        <span key={`${step.label}-${index}`} className={`rounded-full border px-1.5 py-0.5 font-chrome text-[8px] uppercase tracking-wide ${tone[step.state]}`}>
          {step.label} · {step.state === 'pass' ? 'pass' : step.state === 'fail' ? 'fail' : 'unchecked'}
        </span>
      ))}
    </div>
  )
}

function ToolCard({
  icon,
  eyebrow,
  title,
  network = false,
  children,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  network?: boolean
  children: ReactNode
}) {
  return (
    <Card className="flex min-w-0 flex-col p-4 sm:p-5">
      <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
        {icon}
        {eyebrow}
        <span className={`ml-auto rounded-full border px-1.5 py-0.5 text-[8px] tracking-wide ${network ? 'border-mp-wax/40 text-mp-wax' : 'border-mp-proof-border text-mp-proof'}`}>
          {network ? 'NETWORK' : 'LOCAL'}
        </span>
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-mp-ink">{title}</h2>
      <div className="mt-3 flex-1">{children}</div>
    </Card>
  )
}

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={`Copy ${label}`}
      className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-mp-border-subtle px-1.5 py-0.5 font-chrome text-[8px] font-semibold uppercase tracking-wide text-mp-ink-tertiary hover:border-mp-btc/40 hover:text-mp-btc-text focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40"
    >
      <Copy size={8} aria-hidden="true" />
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function FieldRow({ label, value, copy }: { label: string; value: ReactNode; copy?: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2 border-b border-mp-border-subtle/60 py-1 last:border-0">
      <span className="text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{label}</span>
      <span className="flex min-w-0 items-start gap-1 break-words text-[11px] text-mp-ink-secondary">
        <span className="min-w-0 break-words">{value}</span>
        {copy && <CopyButton value={copy} label={label} />}
      </span>
    </div>
  )
}

function ClearButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="ml-2 text-[10px] font-semibold text-mp-ink-tertiary underline decoration-mp-border-subtle underline-offset-2 hover:text-mp-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40 disabled:opacity-40"
    >
      Clear
    </button>
  )
}

const inputClass =
  'mt-1.5 w-full resize-y rounded-mp-md border border-mp-border bg-mp-canvas/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/30'

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-full border border-mp-btc/40 px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-btc-text transition-colors hover:bg-mp-btc/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40 disabled:cursor-not-allowed disabled:opacity-50'

function Bolt11Tool() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<ReturnType<typeof decodeBolt11> | null>(null)
  const [decodedAt, setDecodedAt] = useState<number | null>(null)

  const run = () => {
    setResult(decodeBolt11(raw))
    setDecodedAt(nowSeconds())
  }

  return (
    <ToolCard
      icon={<ScanLine size={11} aria-hidden="true" />}
      eyebrow="BOLT11"
      title="Read an invoice"
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
        <button type="submit" disabled={!raw.trim()} className={`${buttonClass} mt-2`}>
          Decode invoice
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
                { label: 'checksum', state: 'pass' },
                { label: 'payee key', state: result.invoice.payeeNodeKey ? 'unknown' : 'unknown' },
                { label: 'payment', state: 'unknown' },
              ]}
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
      title="Read an offer or check a signature"
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
    <ToolCard icon={<Wallet size={11} aria-hidden="true" />} eyebrow="SHA-256" title="Check a preimage">
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

function Bolt11SignatureTool() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyBolt11Signature>> | null>(null)
  const [busy, setBusy] = useState(false)

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
    <ToolCard icon={<ShieldCheck size={11} aria-hidden="true" />} eyebrow="BOLT11" title="Verify the payee key">
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
        <button type="submit" disabled={busy || !raw.trim()} className={`${buttonClass} mt-2`}>
          {busy ? 'Recovering…' : 'Verify signature'}
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
    <ToolCard icon={<FileKey2 size={11} aria-hidden="true" />} eyebrow="BOLT12" title="Build an invoice request">
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

const CHECK_TONE = {
  pass: 'text-mp-proof',
  fail: 'text-mp-wax',
  unknown: 'text-mp-ink-tertiary',
} as const

function CheckLine({ label, value }: { label: string; value: boolean | null }) {
  const tone = value == null ? 'unknown' : value ? 'pass' : 'fail'
  return (
    <div className={`flex items-center justify-between gap-2 border-b border-mp-border-subtle/60 py-1 text-[10px] last:border-0 ${CHECK_TONE[tone]}`}>
      <span>{label}</span>
      <span className="font-semibold">{value == null ? 'not checked' : value ? 'pass' : 'fail'}</span>
    </div>
  )
}

function LnurlTool() {
  const [raw, setRaw] = useState('')
  const [sats, setSats] = useState('5000')
  const [inspection, setInspection] = useState<Awaited<ReturnType<typeof inspectLnurlPay>> | null>(null)
  const [invoice, setInvoice] = useState<Awaited<ReturnType<typeof requestAndInspectLnurlInvoice>> | null>(null)
  const [busy, setBusy] = useState(false)

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
    <ToolCard icon={<Globe2 size={11} aria-hidden="true" />} eyebrow="LUD-16 / LUD-01" title="Inspect LNURL-pay" network>
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
            <p className="mt-0.5 break-all font-mono text-[9px] text-mp-ink-tertiary">{inspection.inspection.target.endpoint}</p>
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

  const run = async () => {
    setBusy(true)
    setResult(await verifyZapReceipt(raw))
    setBusy(false)
  }

  return (
    <ToolCard icon={<Zap size={11} aria-hidden="true" />} eyebrow="NIP-57" title="Verify a zap receipt">
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

function expectedPubkey(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed.toLowerCase()
  try {
    const decoded = decodeNip19(trimmed)
    return decoded.type === 'npub' ? decoded.data : null
  } catch {
    return null
  }
}

function Nip05Tool() {
  const [handle, setHandle] = useState('')
  const [expected, setExpected] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof resolveNip05>> | null>(null)
  const [pin, setPin] = useState<Nip05PinRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const expectedHex = expected.trim() ? expectedPubkey(expected) : null
  const invalidExpected = Boolean(expected.trim() && !expectedHex)
  const verdict = result?.ok ? nip05Verdict(result.pubkey, expectedHex) : null

  const run = async () => {
    setBusy(true)
    const next = await resolveNip05(handle)
    setResult(next)
    setPin(next.ok ? recordNip05Pin(handle, next.pubkey, next.relays) : null)
    setBusy(false)
  }

  return (
    <ToolCard icon={<BadgeCheck size={11} aria-hidden="true" />} eyebrow="NIP-05" title="Resolve a name to an npub" network>
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Reads the domain&apos;s <span className="font-mono">/.well-known/nostr.json</span> and shows the npub, hex key and
        relays it maps to. A match is domain trust: the domain owner can change the mapping.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="nip05-handle" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          NIP-05 name
        </label>
        <input
          id="nip05-handle"
          value={handle}
          onChange={event => setHandle(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void run()
          }}
          spellCheck={false}
          placeholder="name@domain"
          className={inputClass}
        />
        <label htmlFor="nip05-expected" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Expected key (npub or hex, optional)
        </label>
        <input
          id="nip05-expected"
          value={expected}
          onChange={event => setExpected(event.target.value)}
          spellCheck={false}
          placeholder="npub1… or 64 hex characters"
          className={inputClass}
        />
        {invalidExpected && (
          <p className="mt-1 text-[10px] text-mp-wax">Expected key must be an npub or 64 hex characters.</p>
        )}
        <button type="submit" disabled={busy || !handle.trim() || invalidExpected} className={`${buttonClass} mt-2`}>
          {busy ? 'Resolving…' : 'Resolve name'}
        </button>
        <ClearButton
          onClick={() => {
            setHandle('')
            setExpected('')
            setResult(null)
            setPin(null)
          }}
          disabled={!handle && !expected && !result}
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
              steps={[
                { label: 'domain JSON', state: 'pass' },
                { label: 'key match', state: verdict == null ? 'unknown' : verdict === 'match' ? 'pass' : 'fail' },
                { label: 'domain trust', state: 'unknown' },
              ]}
            />
            <p className={`text-[10px] font-semibold ${verdict === 'mismatch' ? 'text-mp-wax' : verdict === 'match' ? 'text-mp-proof' : 'text-mp-ink-tertiary'}`}>
              {verdict === 'match'
                ? 'Name resolves to the expected key'
                : verdict === 'mismatch'
                  ? 'Name resolves to a different key'
                  : 'Name resolved · no expected key supplied'}
            </p>
            <div className="mt-1.5">
              <FieldRow
                label="NIP-05"
                value={`${result.identifier.name}@${result.identifier.domain}`}
              />
              <FieldRow
                label="npub"
                value={<span className="font-mono text-[10px]">{npubEncode(result.pubkey)}</span>}
                copy={npubEncode(result.pubkey)}
              />
              <FieldRow
                label="Hex key"
                value={<span className="font-mono text-[10px]">{result.pubkey}</span>}
                copy={result.pubkey}
              />
              <FieldRow label="Relays" value={result.relays.length > 0 ? result.relays.join(', ') : 'none advertised'} />
            </div>
            {pin && (
              <div className={`mt-2 border-t border-mp-border-subtle/60 pt-2 text-[10px] leading-relaxed ${pin.status === 'rotated' ? 'text-mp-wax' : 'text-mp-ink-tertiary'}`}>
                <p>
                  {pin.status === 'new'
                    ? 'Pinned the first key seen for this name in this browser.'
                    : pin.status === 'same'
                      ? 'Same key as the local continuity pin.'
                      : 'Key changed since the local pin. Verify the new key out of band before trusting it.'}
                </p>
                {pin.previous && (
                  <p className="mt-1 break-all font-mono text-[9px]">
                    Pinned {pin.previous.pubkey.slice(0, 16)}… → now {pin.pin.pubkey.slice(0, 16)}…
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    forgetNip05Pin(handle)
                    setPin(null)
                  }}
                  className="mt-1 font-chrome text-[9px] uppercase tracking-wide text-mp-ink-tertiary underline underline-offset-2 hover:text-mp-ink"
                >
                  Forget local pin
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolCard>
  )
}

function AddressPsbtTool() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof inspectBitcoinInput>> | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    setResult(await inspectBitcoinInput(raw))
    setBusy(false)
  }

  return (
    <ToolCard icon={<Landmark size={11} aria-hidden="true" />} eyebrow="BASE LAYER" title="Read an address or PSBT">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Derives the scriptPubKey from a bech32, bech32m or Base58Check address, or reads a base64/hex PSBT. Supported
        ECDSA and Schnorr signatures are verified against the unsigned transaction; unsupported inputs are labelled, not
        guessed. Nothing is signed or broadcast.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="address-psbt-input" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Address or PSBT
        </label>
        <textarea
          id="address-psbt-input"
          value={raw}
          onChange={event => setRaw(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void run()
          }}
          rows={3}
          spellCheck={false}
          placeholder="bc1… / 1… / cHNidP…"
          className={inputClass}
        />
        <button type="submit" disabled={busy || !raw.trim()} className={`${buttonClass} mt-2`}>
          {busy ? 'Reading…' : 'Inspect'}
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
        {result?.result.ok === false && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {result.result.error}
          </p>
        )}
        {result?.kind === 'address' && result.result.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-mp-proof">
              <CheckCircle2 size={11} aria-hidden="true" /> Address checksum valid
            </p>
            <div className="mt-1.5">
              <FieldRow label="Network" value={result.result.address.network} />
              <FieldRow label="Type" value={result.result.address.type} />
              <FieldRow
                label="scriptPubKey"
                value={<span className="font-mono text-[10px]">{result.result.address.scriptPubKey}</span>}
                copy={result.result.address.scriptPubKey}
              />
              <FieldRow
                label="Program"
                value={<span className="font-mono text-[10px]">{result.result.address.program ?? '—'}</span>}
                copy={result.result.address.program ?? undefined}
              />
            </div>
          </div>
        )}
        {result?.kind === 'psbt' && result.result.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <VerificationTrail
              steps={[
                { label: 'structure', state: 'pass' },
                {
                  label: 'signatures',
                  state:
                    result.result.psbt.signaturesInvalid > 0
                      ? 'fail'
                      : result.result.psbt.signaturesValid > 0
                        ? 'pass'
                        : 'unknown',
                },
                { label: 'broadcast', state: 'unknown' },
              ]}
            />
            <p className="text-[10px] font-semibold text-mp-proof">PSBT structure read · signatures checked where supported</p>
            <div className="mt-1.5">
              <FieldRow label="Version" value={result.result.psbt.version} />
              <FieldRow label="Inputs / outputs" value={`${result.result.psbt.inputs} / ${result.result.psbt.outputs}`} />
              <FieldRow label="Partial signatures" value={result.result.psbt.partialSigs} />
              <FieldRow label="Taproot signatures" value={result.result.psbt.tapSigs} />
              <FieldRow
                label="Verification"
                value={`${result.result.psbt.signaturesValid} valid · ${result.result.psbt.signaturesInvalid} invalid · ${result.result.psbt.signaturesUnsupported} unchecked`}
              />
              <FieldRow
                label="Input value"
                value={result.result.psbt.inputSats == null ? 'incomplete witness UTXOs' : formatSatsExact(result.result.psbt.inputSats)}
              />
              <FieldRow
                label="Output value"
                value={result.result.psbt.outputSats == null ? 'unreadable' : formatSatsExact(result.result.psbt.outputSats)}
              />
              <FieldRow
                label="Fee"
                value={result.result.psbt.feeSats == null ? 'not computable from witness UTXOs' : formatSatsExact(result.result.psbt.feeSats)}
              />
            </div>
            <div className="mt-2 space-y-2">
              {result.result.psbt.inputDetails.map((input, index) => (
                <div key={`input-${index}`} className="rounded-mp-sm border border-mp-border-subtle/60 p-1.5">
                  <p className="font-chrome text-[9px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">Input {index}</p>
                  <FieldRow label="Prev txid" value={<span className="break-all font-mono text-[9px]">{input.prevTxid ?? '—'}</span>} />
                  <FieldRow label="Prev vout" value={input.vout ?? '—'} />
                  <FieldRow label="Type" value={input.scriptType} />
                  <FieldRow
                    label="Address"
                    value={<span className="font-mono text-[9px]">{input.address ?? 'not in witness UTXO'}</span>}
                    copy={input.address ?? undefined}
                  />
                  {input.nonWitnessUtxo && <FieldRow label="Non-witness UTXO" value="present" />}
                  {input.signatures.map((signature, signatureIndex) => (
                    <p
                      key={`sig-${index}-${signatureIndex}`}
                      className={`mt-1 text-[9px] leading-relaxed ${signature.status === 'invalid' ? 'text-mp-wax' : signature.status === 'valid' ? 'text-mp-proof' : 'text-mp-ink-tertiary'}`}
                    >
                      {signature.scheme.toUpperCase()} {signature.status}: {signature.note}
                    </p>
                  ))}
                </div>
              ))}
              {result.result.psbt.outputDetails.map((output, index) => (
                <div key={`output-${index}`} className="rounded-mp-sm border border-mp-border-subtle/60 p-1.5">
                  <p className="font-chrome text-[9px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">Output {index}</p>
                  <FieldRow
                    label="Value"
                    value={output.amountSats == null ? 'unreadable' : formatSatsExact(output.amountSats)}
                  />
                  <FieldRow label="Type" value={output.scriptType} />
                  <FieldRow
                    label="Address"
                    value={<span className="font-mono text-[9px]">{output.address ?? 'custom script'}</span>}
                    copy={output.address ?? undefined}
                  />
                  {(output.possibleChange || output.addressReuse || output.dust) && (
                    <p className="mt-1 text-[9px] leading-relaxed text-mp-wax">
                      {output.possibleChange ? 'Possible change. ' : ''}
                      {output.addressReuse && !output.possibleChange ? 'Address reuse. ' : ''}
                      {output.dust ? 'Below dust threshold. ' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-mp-ink-tertiary">
              PSBTs do not encode a network, so these addresses use Bitcoin mainnet prefixes.
            </p>
            {result.result.psbt.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-mp-wax">
                {result.result.psbt.warnings.map(warning => (
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

function SilentPaymentsTool() {
  const [address, setAddress] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [txid, setTxid] = useState('')
  const [vout, setVout] = useState('0')
  const [decoded, setDecoded] = useState<Awaited<ReturnType<typeof decodeSilentPaymentAddress>> | null>(null)
  const [derived, setDerived] = useState<Awaited<ReturnType<typeof deriveSilentPaymentOutput>> | null>(null)

  const run = async () => {
    const next = decodeSilentPaymentAddress(address)
    setDecoded(next)
    if (!next.ok || !privateKey.trim()) {
      setDerived(null)
      return
    }
    setDerived(
      await deriveSilentPaymentOutput({
        address,
        inputPrivateKey: privateKey,
        txid,
        vout: Number(vout),
      }),
    )
  }

  return (
    <ToolCard icon={<Wallet size={11} aria-hidden="true" />} eyebrow="BIP-352" title="Read a Silent Payment address">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Decodes an <span className="font-mono">sp1…</span> address into its scan and spend keys. An optional input key derives one
        one-time P2TR output for a specific outpoint; it is used in this tab and never stored. This does not scan the chain.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          void run()
        }}
      >
        <label htmlFor="sp-address" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Silent Payment address
        </label>
        <input
          id="sp-address"
          value={address}
          onChange={event => setAddress(event.target.value)}
          spellCheck={false}
          placeholder="sp1… or tsp1…"
          className={inputClass}
        />
        <label htmlFor="sp-key" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Input private key (hex, optional)
        </label>
        <input
          id="sp-key"
          type="password"
          value={privateKey}
          onChange={event => setPrivateKey(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="kept in this tab only"
          className={inputClass}
        />
        <div className="grid grid-cols-[1fr_90px] gap-2">
          <div>
            <label htmlFor="sp-txid" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              Smallest input txid
            </label>
            <input id="sp-txid" value={txid} onChange={event => setTxid(event.target.value)} spellCheck={false} placeholder="64 hex" className={inputClass} />
          </div>
          <div>
            <label htmlFor="sp-vout" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
              vout
            </label>
            <input id="sp-vout" value={vout} onChange={event => setVout(event.target.value)} inputMode="numeric" className={inputClass} />
          </div>
        </div>
        <button type="submit" disabled={!address.trim()} className={`${buttonClass} mt-2`}>
          Read address
        </button>
        <ClearButton
          onClick={() => {
            setAddress('')
            setPrivateKey('')
            setTxid('')
            setVout('0')
            setDecoded(null)
            setDerived(null)
          }}
          disabled={!address && !privateKey && !txid && !decoded}
        />
      </form>
      <div aria-live="polite" className="mt-3">
        {decoded && !decoded.ok && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            {decoded.error}
          </p>
        )}
        {decoded?.ok && (
          <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
            <VerificationTrail
              steps={[
                { label: 'bech32m', state: 'pass' },
                { label: 'keys', state: 'pass' },
                { label: 'output', state: derived?.ok ? 'pass' : derived ? 'fail' : 'unknown' },
                { label: 'chain scan', state: 'unknown' },
              ]}
            />
            <p className="text-[10px] font-semibold text-mp-proof">Address decodes · version 0</p>
            <div className="mt-1.5">
              <FieldRow label="Network" value={decoded.address.network} />
              <FieldRow label="Scan key" value={<span className="break-all font-mono text-[9px]">{decoded.address.scanPubkey}</span>} copy={decoded.address.scanPubkey} />
              <FieldRow label="Spend key" value={<span className="break-all font-mono text-[9px]">{decoded.address.spendPubkey}</span>} copy={decoded.address.spendPubkey} />
            </div>
            {derived && !derived.ok && <p className="mt-2 text-[10px] text-mp-wax">{derived.error}</p>}
            {derived?.ok && (
              <div className="mt-2 rounded-mp-sm border border-mp-border-subtle/60 p-1.5">
                <FieldRow label="Output key" value={<span className="break-all font-mono text-[9px]">{derived.xOnlyPubkey}</span>} copy={derived.xOnlyPubkey} />
                <FieldRow label="scriptPubKey" value={<span className="break-all font-mono text-[9px]">{derived.scriptPubKey}</span>} copy={derived.scriptPubKey} />
                <FieldRow label="One-time address" value={<span className="break-all font-mono text-[9px]">{derived.address}</span>} copy={derived.address} />
                <FieldRow label="Input hash" value={<span className="break-all font-mono text-[9px]">{derived.inputHash}</span>} />
              </div>
            )}
            <p className="mt-2 text-[9px] leading-relaxed text-mp-ink-tertiary">
              A derived output proves this address and outpoint produce that script. It does not prove the receiver scanned it or
              that a payment was broadcast. Reusing an input key across wallets can break the sender-side privacy assumption.
            </p>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

function Nip17Tool() {
  const [raw, setRaw] = useState('')
  const [secret, setSecret] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof inspectNip17GiftWrap>> | null>(null)

  const run = () => setResult(inspectNip17GiftWrap(raw, secret))

  return (
    <ToolCard icon={<ShieldCheck size={11} aria-hidden="true" />} eyebrow="NIP-17 / NIP-59" title="Inspect a gift-wrapped DM">
      <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
        Checks the public kind 1059 wrapper, then optionally unwraps the NIP-44 seal and unsigned rumor with the recipient key.
        The key stays in this tab; it is never stored, returned or logged. A valid seal proves the sender key, not delivery.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          run()
        }}
      >
        <label htmlFor="nip17-event" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Gift-wrap event JSON
        </label>
        <textarea id="nip17-event" value={raw} onChange={event => setRaw(event.target.value)} rows={5} spellCheck={false} placeholder='{"kind":1059,…}' className={`${inputClass} font-mono text-[9px]`} />
        <label htmlFor="nip17-secret" className="mt-2 block font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Recipient nsec or hex (optional, to unwrap)
        </label>
        <input id="nip17-secret" type="password" value={secret} onChange={event => setSecret(event.target.value)} spellCheck={false} autoComplete="off" placeholder="kept in this tab only" className={inputClass} />
        <button type="submit" disabled={!raw.trim()} className={`${buttonClass} mt-2`}>
          Inspect DM
        </button>
        <ClearButton onClick={() => { setRaw(''); setSecret(''); setResult(null) }} disabled={!raw && !secret && !result} />
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
                { label: 'wrapper sig', state: result.result.checks.signature ? 'pass' : 'fail' },
                { label: 'one recipient', state: result.result.checks.oneRecipient ? 'pass' : 'fail' },
                { label: 'seal', state: result.result.unlocked ? (result.result.unlocked.checks.sealSignature ? 'pass' : 'fail') : 'unknown' },
                { label: 'sender match', state: result.result.unlocked ? (result.result.unlocked.checks.senderMatches ? 'pass' : 'fail') : 'unknown' },
              ]}
            />
            <div>
              <CheckLine label="Kind 1059 / 21059" value={result.result.checks.kind} />
              <CheckLine label="Wrapper signature" value={result.result.checks.signature} />
              <CheckLine label="One recipient" value={result.result.checks.oneRecipient} />
              <CheckLine label="Past timestamp" value={result.result.checks.pastTimestamp} />
            </div>
            <div className="mt-1.5">
              <FieldRow label="Wrapper author" value={<span className="break-all font-mono text-[9px]">{result.result.event.pubkey}</span>} />
              <FieldRow label="Recipients" value={result.result.recipients.length > 0 ? result.result.recipients.join(', ') : 'none'} />
            </div>
            {result.result.unlockError && <p className="mt-2 text-[10px] leading-relaxed text-mp-wax">No unwrap: {result.result.unlockError}</p>}
            {result.result.unlocked && (
              <div className="mt-2 rounded-mp-sm border border-mp-border-subtle/60 p-1.5">
                <div className="mb-1 flex flex-wrap items-center gap-1">
                  <CheckLine label="Seal kind 13" value={result.result.unlocked.checks.sealKind} />
                  <CheckLine label="Seal signature" value={result.result.unlocked.checks.sealSignature} />
                  <CheckLine label="Empty seal tags" value={result.result.unlocked.checks.sealEmptyTags} />
                  <CheckLine label="Sender matches rumor" value={result.result.unlocked.checks.senderMatches} />
                  <CheckLine label="Rumor id" value={result.result.unlocked.checks.rumorId} />
                  <CheckLine label="DM kind" value={result.result.unlocked.checks.rumorKind} />
                </div>
                <FieldRow label="Sender npub" value={<span className="break-all font-mono text-[9px]">{npubEncode(result.result.unlocked.rumor.pubkey)}</span>} copy={npubEncode(result.result.unlocked.rumor.pubkey)} />
                <FieldRow label="Sent" value={new Date(result.result.unlocked.rumor.created_at * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'} />
                <p className="mt-1 font-chrome text-[9px] uppercase tracking-wide text-mp-ink-tertiary">Content</p>
                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-mp-sm bg-mp-canvas/70 p-2 text-[10px] text-mp-ink">{result.result.unlocked.rumor.content}</pre>
              </div>
            )}
            {result.result.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-mp-wax">
                {result.result.warnings.map(warning => <li key={warning}>{warning}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </ToolCard>
  )
}

export function ToolsPage() {
  const [active, setActive] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const id = window.location.hash.replace('#', '')
    return BITCOIN_TOOLS.some(tool => tool.id === id) ? id : null
  })

  const select = (id: string) => {
    setActive(id)
    history.replaceState(null, '', `#${id}`)
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const showAll = () => {
    setActive(null)
    history.replaceState(null, '', window.location.pathname)
  }

  const visibility = (id: string) => `scroll-mt-28 ${active && active !== id ? 'hidden lg:block' : ''}`

  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="BITCOIN TOOLS"
        title="Read it yourself"
        subtitle="Start with what you have, then read it in this tab. LNURL and NIP-05 are the only network calls, and only when you press Inspect. Each result carries a verification trail and says what it cannot prove."
        actions={
          <Link to="/verify" className="chip text-xs">
            Verify a stamped hash →
          </Link>
        }
      />

      <section aria-label="Choose a tool by what you have" className="mb-5 rounded-mp-lg border border-mp-border-subtle bg-mp-card/40 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">What do you have?</p>
          {active && (
            <button type="button" onClick={showAll} className="font-chrome text-[9px] uppercase tracking-wide text-mp-ink-tertiary underline underline-offset-2 hover:text-mp-ink">
              Show all tools
            </button>
          )}
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => select(item.id)}
              aria-pressed={active === item.id}
              className={`rounded-mp-md border px-2.5 py-2 text-left transition-colors ${active === item.id ? 'border-mp-proof-border bg-mp-proof/10' : 'border-mp-border-subtle bg-mp-canvas/40 hover:border-mp-border-strong'}`}
            >
              <span className="block text-[11px] font-semibold text-mp-ink">{item.label}</span>
              <span className="mt-0.5 block text-[9px] leading-snug text-mp-ink-tertiary">{item.hint}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-mp-ink-tertiary lg:hidden">
          On a small screen, choosing one card shows only that card. The guide stays here so you can switch without scrolling.
        </p>
      </section>

      <nav
        aria-label="Bitcoin tools on this page"
        className="sticky top-16 z-20 -mx-1 mb-5 rounded-mp-lg border border-mp-border-subtle bg-mp-canvas/95 p-2 shadow-sm backdrop-blur"
      >
        <p className="mb-1.5 px-1 font-chrome text-[9px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
          12 tools · 10 local · 2 network
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BITCOIN_TOOLS.map(tool => (
            <a
              key={tool.href}
              href={tool.href}
              onClick={event => {
                event.preventDefault()
                select(tool.id)
              }}
              aria-current={active === tool.id ? 'true' : undefined}
              className={`chip gap-1 text-[10px] ${active === tool.id ? 'border-mp-proof-border text-mp-proof' : ''}`}
              title={tool.network ? 'Makes one https request' : 'Runs entirely in this tab'}
            >
              {tool.label}
              <span className={tool.network ? 'text-mp-wax' : 'text-mp-proof'} aria-hidden="true">
                {tool.network ? 'net' : 'local'}
              </span>
            </a>
          ))}
        </div>
      </nav>

      <div className="grid gap-4 lg:grid-cols-2">
        <div id="bolt11" className={visibility('bolt11')}>
          <Bolt11Tool />
        </div>
        <div id="bolt11-signature" className={visibility('bolt11-signature')}>
          <Bolt11SignatureTool />
        </div>
        <div id="bolt12" className={visibility('bolt12')}>
          <Bolt12Tool />
        </div>
        <div id="bolt12-request" className={visibility('bolt12-request')}>
          <Bolt12RequestTool />
        </div>
        <div id="preimage" className={visibility('preimage')}>
          <PreimageTool />
        </div>
        <div id="receipt" className={visibility('receipt')}>
          <Card className="flex min-w-0 flex-col p-4 sm:p-5">
            <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
              <Receipt size={11} aria-hidden="true" />
              NOSTR RECEIPT
              <span className="ml-auto rounded-full border border-mp-proof-border px-1.5 py-0.5 text-[8px] tracking-wide text-mp-proof">
                LOCAL
              </span>
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-mp-ink">Check a gap-tip receipt</h2>
            <div className="mt-3 flex-1">
              <ReceiptInspector />
            </div>
          </Card>
        </div>
        <div id="lnurl" className={visibility('lnurl')}>
          <LnurlTool />
        </div>
        <div id="zap" className={visibility('zap')}>
          <ZapReceiptTool />
        </div>
        <div id="nip05" className={visibility('nip05')}>
          <Nip05Tool />
        </div>
        <div id="nip17" className={visibility('nip17')}>
          <Nip17Tool />
        </div>
        <div id="address-psbt" className={`${visibility('address-psbt')} lg:col-span-2`}>
          <AddressPsbtTool />
        </div>
        <div id="silent-payments" className={visibility('silent-payments')}>
          <SilentPaymentsTool />
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-mp-ink-tertiary">
        Ten tools run entirely offline. LNURL and NIP-05 are the exceptions: pressing Inspect makes one https request
        to the endpoint or domain you named. A valid BOLT11 checksum and matching payee key mean the invoice is well formed
        and signed by its stated key, not that it is payable; a valid BOLT12 request signature means the message was
        signed by its payer key; a matching preimage means the hash relation holds. None of these proves a payment
        occurred.
      </p>
    </div>
  )
}
