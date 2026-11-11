import { useMemo, useState } from 'react'
import { Diff, TriangleAlert } from 'lucide-react'
import { Card } from '../ui/Card'
import { diffVerificationReceipts, groupDigestFingerprint } from '../../lib/receiptDiff'
import {
  parseVerificationReceipt,
  verificationReceiptDigest,
  type VerificationReceipt,
} from '../../lib/verificationReceipt'

/**
 * A digest mismatch proves only that the encoded receipt changed. It cannot
 * name the changed field without a second copy. This panel asks for that copy
 * and labels a reference whose own digest does not match the link.
 */
export function ReceiptDiffPanel({
  receipt,
  digest,
  providedDigest,
  hashMatches,
}: {
  receipt: VerificationReceipt
  digest: string
  providedDigest: string | null
  hashMatches: boolean
}) {
  const [raw, setRaw] = useState('')
  const [reference, setReference] = useState<VerificationReceipt | null>(null)
  const [error, setError] = useState('')

  const referenceDigest = reference ? verificationReceiptDigest(reference) : null
  const referenceMatchesLink = Boolean(providedDigest && referenceDigest === providedDigest)
  const rows = useMemo(
    () => (reference ? diffVerificationReceipts(reference, receipt) : []),
    [receipt, reference],
  )

  const compare = () => {
    try {
      const parsed = parseVerificationReceipt(JSON.parse(raw))
      if (!parsed.ok) {
        setError(parsed.error)
        setReference(null)
        return
      }
      setReference(parsed.receipt)
      setError('')
    } catch {
      setError('That is not valid JSON.')
      setReference(null)
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
        <Diff size={12} aria-hidden="true" /> Compare with the original
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-mp-ink">What changed?</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-mp-ink-tertiary">
        {hashMatches
          ? 'The link digest matches this payload. To catch a receipt that was edited before the link was made, paste an independent copy and compare the fields.'
          : 'The link digest does not match this payload. A hash alone cannot identify the changed field, so paste the receipt copy you received separately. Without that reference, this page can only show that the bytes differ.'}
      </p>

      {providedDigest && (
        <div className="mt-2 rounded-mp-md border border-mp-border-subtle bg-mp-canvas/40 p-2.5 text-[11px]">
          <p className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">Digest carried by link</p>
          <p className="mt-0.5 break-all font-mono text-mp-ink-secondary">{groupDigestFingerprint(providedDigest)}</p>
          <p className="mt-1 font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">Digest of this payload</p>
          <p className="mt-0.5 break-all font-mono text-mp-ink-secondary">{groupDigestFingerprint(digest)}</p>
        </div>
      )}

      <label htmlFor="receipt-diff-reference" className="mt-3 block font-chrome text-[11px] font-semibold text-mp-ink-secondary">
        Original receipt JSON (from a separate copy)
      </label>
      <textarea
        id="receipt-diff-reference"
        value={raw}
        onChange={event => {
          setRaw(event.target.value)
          setError('')
        }}
        rows={4}
        spellCheck={false}
        placeholder='{"version":1,"app":"MotoPass",…}'
        className="mt-1.5 w-full resize-y rounded-mp-md border border-mp-border bg-mp-canvas/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/30"
      />
      <button
        type="button"
        onClick={compare}
        disabled={!raw.trim()}
        className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-mp-btc/40 px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-btc-text hover:bg-mp-btc/10 disabled:opacity-50"
      >
        <Diff size={12} aria-hidden="true" /> Compare fields
      </button>

      {error && <p className="mt-2 text-[11px] text-mp-wax">{error}</p>}
      {reference && (
        <div className="mt-3" aria-live="polite">
          <p className="text-[11px] text-mp-ink-secondary">
            Reference digest: <span className="break-all font-mono">{referenceDigest?.slice(0, 20)}…</span>{' '}
            {providedDigest ? (referenceMatchesLink ? '· matches the link digest' : '· does not match the link digest') : '· no link digest to compare'}
          </p>
          {!referenceMatchesLink && providedDigest && (
            <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
              <TriangleAlert size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              The reference copy does not match the digest carried by the link. The differences below may be between two
              different versions, not evidence of what one attacker changed.
            </p>
          )}
          {rows.length === 0 ? (
            <p className="mt-2 rounded-mp-md border border-mp-proof-border p-2 text-[11px] text-mp-proof">
              No canonical fields differ between the reference and this payload.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-mp-md border border-mp-border-subtle">
              <table className="w-full min-w-[34rem] border-collapse text-left text-[11px]">
                <thead className="bg-mp-canvas/60 font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
                  <tr>
                    <th className="px-2 py-1.5">Field</th>
                    <th className="px-2 py-1.5">Original</th>
                    <th className="px-2 py-1.5">This payload</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.path} className="border-t border-mp-border-subtle/60 align-top">
                      <td className="px-2 py-1.5 font-mono text-[10px] text-mp-ink-tertiary">{row.path}</td>
                      <td className="max-w-[15rem] px-2 py-1.5 text-mp-ink-secondary">{row.before}</td>
                      <td className="max-w-[15rem] px-2 py-1.5 text-mp-ink">{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
            A field-level diff is only as trustworthy as the reference copy. The digest match is evidence that the
            receipt bytes were not changed after that digest was made, not that the claims are true.
          </p>
        </div>
      )}
    </Card>
  )
}
