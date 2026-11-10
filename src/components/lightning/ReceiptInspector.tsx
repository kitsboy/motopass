import { useState } from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { inspectTipReceiptJson, type ReceiptDetails } from '../../lib/receiptInspect'
import { checkPreimage, type PreimageCheck } from '../../lib/preimage'
import { useToolIntake } from '../tools/toolsShared'

/**
 * Independent check of a pasted receipt.
 *
 * This exists so a receipt can be checked without trusting MotoPass or the
 * device that made it: the signature and the sha256 relation are evaluated in
 * this browser, and a failure says so instead of softening itself.
 */

type Outcome =
  | { ok: false; error: string }
  | { ok: true; details: ReceiptDetails; id: string; pubkey: string; createdAt: number }

function preimageCopy(result: PreimageCheck, hasPreimage: boolean): { tone: string; text: string } {
  if (!hasPreimage) return { tone: 'text-mp-ink-tertiary', text: 'No preimage in this receipt, so only the hash can be read.' }
  if (result === 'match') {
    return { tone: 'text-mp-proof', text: 'sha256(preimage) equals the payment hash in this receipt.' }
  }
  if (result === 'mismatch') {
    return { tone: 'text-mp-wax', text: 'The preimage does not hash to the payment hash in this receipt.' }
  }
  return { tone: 'text-mp-ink-tertiary', text: 'The preimage could not be checked in this browser.' }
}

export function ReceiptInspector() {
  const [raw, setRaw] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [preimage, setPreimage] = useState<PreimageCheck>('unreadable')
  const [busy, setBusy] = useState(false)

  useToolIntake('receipt', setRaw)

  const verify = async () => {
    setBusy(true)
    const inspected = inspectTipReceiptJson(raw)
    if (!inspected.ok) {
      setOutcome({ ok: false, error: inspected.error })
      setPreimage('unreadable')
      setBusy(false)
      return
    }
    setOutcome({
      ok: true,
      details: inspected.details,
      id: inspected.receipt.id,
      pubkey: inspected.receipt.pubkey,
      createdAt: inspected.receipt.created_at,
    })
    setPreimage(
      inspected.details.preimage && inspected.details.paymentHash
        ? await checkPreimage(inspected.details.preimage, inspected.details.paymentHash)
        : 'unreadable',
    )
    setBusy(false)
  }

  const evidence = outcome?.ok ? preimageCopy(preimage, Boolean(outcome.details.preimage)) : null

  return (
    <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/30 p-2.5">
      <p className="font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">
        Check a receipt
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-mp-ink-tertiary">
        Paste a receipt event to verify its signature and, when a preimage is present, the sha256 relation. Nothing is
        fetched or published.
      </p>
      <label className="sr-only" htmlFor="receipt-inspector">
        Receipt event JSON
      </label>
      <textarea
        id="receipt-inspector"
        value={raw}
        onChange={event => setRaw(event.target.value)}
        rows={4}
        spellCheck={false}
        placeholder='{"kind":30078,"pubkey":"…","sig":"…",…}'
        className="mt-2 w-full resize-y rounded-mp-md border border-mp-border bg-mp-card px-2 py-1.5 font-mono text-[10px] text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/50 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => void verify()}
        disabled={busy || !raw.trim()}
        className="mt-2 rounded-full border border-mp-btc/40 px-2.5 py-1 font-chrome text-[10px] font-semibold text-mp-btc-text hover:bg-mp-btc/10 disabled:opacity-50"
      >
        {busy ? 'Checking…' : 'Verify locally'}
      </button>

      {outcome && !outcome.ok && (
        <p className="mt-2 flex items-start gap-1 text-[10px] leading-relaxed text-mp-wax">
          <ShieldAlert size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          {outcome.error}
        </p>
      )}

      {outcome?.ok && (
        <div className="mt-2 space-y-1 border-t border-mp-border-subtle pt-2 text-[10px] leading-relaxed">
          <p className="flex items-center gap-1 font-semibold text-mp-proof">
            <ShieldCheck size={11} aria-hidden="true" /> Signature verifies against this event id
          </p>
          <p className="text-mp-ink-secondary">
            {outcome.details.program ?? 'program not tagged'} · {outcome.details.field ?? 'field not tagged'}
            {outcome.details.country ? ` · ${outcome.details.country}` : ''}
            {outcome.details.sats != null ? ` · ${outcome.details.sats.toLocaleString()} sats` : ''}
          </p>
          <p className="font-mono text-[10px] text-mp-ink-tertiary">
            signed by {outcome.pubkey.slice(0, 12)}… · {new Date(outcome.createdAt * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC
          </p>
          {evidence && <p className={evidence.tone}>{evidence.text}</p>}
          <p className="text-[10px] text-mp-ink-tertiary">
            A valid signature shows who recorded the payment. It does not show what the invoice was for.
          </p>
        </div>
      )}
    </div>
  )
}
