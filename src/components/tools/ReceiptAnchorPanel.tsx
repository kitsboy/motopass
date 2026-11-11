import { useState } from 'react'
import { Anchor, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { anchorReceiptDigest, type ReceiptAnchorResult } from '../../lib/receiptAnchor'

/**
 * Optional digest anchoring through Satohash/OpenTimestamps.
 * Only the SHA-256 is submitted; the receipt itself stays in the fragment.
 */
export function ReceiptAnchorPanel({ digest }: { digest: string }) {
  const [result, setResult] = useState<ReceiptAnchorResult | null>(null)
  const [busy, setBusy] = useState(false)

  const anchor = async () => {
    setBusy(true)
    setResult(await anchorReceiptDigest(digest))
    setBusy(false)
  }

  return (
    <Card className="p-4 sm:p-6">
      <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
        <Anchor size={12} aria-hidden="true" /> Optional proof-of-existence anchor
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-mp-ink-secondary">
        Submit only this receipt’s SHA-256 to Satohash for OpenTimestamps anchoring. The receipt contents are not sent.
        A confirmed anchor proves the digest existed by a Bitcoin block; it does not prove the receipt’s claims or a
        payment.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void anchor()}
          disabled={busy || !/^[a-f0-9]{64}$/i.test(digest)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-mp-btc/40 px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-btc-text hover:bg-mp-btc/10 disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Anchor size={12} aria-hidden="true" />}
          {busy ? 'Submitting digest…' : 'Anchor digest on Satohash'}
        </button>
        <span className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">One network request</span>
      </div>
      <div aria-live="polite" className="mt-2">
        {result && (
          <div
            className={`rounded-mp-md border p-2.5 text-[11px] leading-relaxed ${
              result.status === 'error'
                ? 'border-mp-wax/40 text-mp-wax'
                : result.status === 'confirmed'
                  ? 'border-mp-proof-border text-mp-proof'
                  : 'border-mp-border-subtle text-mp-ink-secondary'
            }`}
          >
            <p className="flex items-center gap-1.5 font-semibold">
              {result.status === 'error' ? (
                <AlertTriangle size={12} aria-hidden="true" />
              ) : (
                <CheckCircle2 size={12} aria-hidden="true" />
              )}
              {result.status === 'confirmed'
                ? `Anchored${result.blockHeight != null ? ` in block ${result.blockHeight}` : ''}`
                : result.status === 'pending'
                  ? 'Submitted · waiting for a Bitcoin block'
                  : 'Anchor not confirmed'}
            </p>
            <p className="mt-1">{result.note}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {result.verifyUrl && (
                <a href={result.verifyUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  Open Satohash proof ↗
                </a>
              )}
              {result.guideUrl && (
                <a href={result.guideUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  Stamp guide ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
