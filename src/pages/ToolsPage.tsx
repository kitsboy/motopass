import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, FileKey2, Receipt, ScanLine, Wallet } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { ReceiptInspector } from '../components/lightning/ReceiptInspector'
import { decodeBolt11, bolt11AmountSats, bolt11ExpiryLabel } from '../lib/bolt11'
import { decodeBolt12, type Bolt12Decoded } from '../lib/bolt12'
import { checkPreimage, type PreimageCheck } from '../lib/preimage'
import { formatSatsExact } from '../lib/satsAnchor'

/**
 * Bitcoin / Lightning readers that run entirely in this tab.
 *
 * None of these tools calls a node, a relay or an explorer. That limits what
 * they can say: BOLT11 is decoded (its signature is not checked), a BOLT12
 * offer is structurally read and is unsigned by design, and a receipt is
 * checked for its signature and preimage relation only. The copy on each card
 * states the limit instead of implying a payment was proven.
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
  { href: '#bolt11', label: 'BOLT11 invoice' },
  { href: '#bolt12', label: 'BOLT12 message' },
  { href: '#preimage', label: 'Preimage check' },
  { href: '#receipt', label: 'Receipt verify' },
] as const

function ToolCard({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <Card className="flex min-w-0 flex-col p-4 sm:p-5">
      <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
        {icon}
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-mp-ink">{title}</h2>
      <div className="mt-3 flex-1">{children}</div>
    </Card>
  )
}

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2 border-b border-mp-border-subtle/60 py-1 last:border-0">
      <span className="text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{label}</span>
      <span className="min-w-0 break-words text-[11px] text-mp-ink-secondary">{value}</span>
    </div>
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
        Amount, expiry, payment hash and description. The bech32 checksum is checked; the ECDSA signature is not, so
        this is a decode, not a payment guarantee.
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

export function ToolsPage() {
  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="BITCOIN TOOLS"
        title="Read it yourself"
        subtitle="Invoices, offers and receipts, decoded in this tab. Nothing here calls a node, a relay or an explorer — and each card says what it cannot prove."
        actions={
          <Link to="/verify" className="chip text-xs">
            Verify a stamped hash →
          </Link>
        }
      />

      <nav aria-label="Bitcoin tools on this page" className="mb-5 flex flex-wrap gap-2">
        {BITCOIN_TOOLS.map(tool => (
          <a key={tool.href} href={tool.href} className="chip text-[11px]">
            {tool.label}
          </a>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-2">
        <div id="bolt11" className="scroll-mt-24">
          <Bolt11Tool />
        </div>
        <div id="bolt12" className="scroll-mt-24">
          <Bolt12Tool />
        </div>
        <div id="preimage" className="scroll-mt-24">
          <PreimageTool />
        </div>
        <div id="receipt" className="scroll-mt-24">
          <Card className="flex min-w-0 flex-col p-4 sm:p-5">
            <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
              <Receipt size={11} aria-hidden="true" />
              NOSTR RECEIPT
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-mp-ink">Check a gap-tip receipt</h2>
            <div className="mt-3 flex-1">
              <ReceiptInspector />
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-mp-ink-tertiary">
        All four tools run offline in this tab. A valid BOLT11 checksum means the string is well formed, not that the
        invoice is payable; a valid BOLT12 invoice signature means the message was signed by its stated key; a matching
        preimage means the hash relation holds. None of them proves a payment occurred.
      </p>
    </div>
  )
}
