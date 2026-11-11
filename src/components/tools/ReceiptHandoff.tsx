import { Link2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { buildReceiptShareLink, type VerificationReceipt } from '../../lib/verificationReceipt'
import { groupDigestFingerprint } from '../../lib/receiptDiff'
import { ReceiptQr } from './ReceiptQr'
import { CopyButton } from './toolsShared'

/**
 * Cross-device handoff: the sender shows a QR, the recipient scans it, and the
 * digest fingerprint can be compared by voice or another channel. The receipt
 * still lives in the URL fragment and is never uploaded.
 */
export function ReceiptHandoff({ receipt, digest }: { receipt: VerificationReceipt; digest: string }) {
  const link = buildReceiptShareLink(receipt)
  return (
    <Card className="p-4 sm:p-6">
      <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
        <Link2 size={12} aria-hidden="true" /> Cross-device handoff
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
        {link.ok ? (
          <ReceiptQr url={link.url} label="MotoPass receipt link" />
        ) : (
          <p className="rounded-mp-md border border-mp-wax/40 p-2 text-[11px] text-mp-wax">{link.error}</p>
        )}
        <div>
          <p className="text-[12px] leading-relaxed text-mp-ink-secondary">
            Show this code to the recipient. Scanning opens this verifier with the receipt in the fragment; no server
            receives it. For a stronger check, read the fingerprint below over a separate channel and compare it with
            the sender’s screen.
          </p>
          <p className="mt-2 break-all font-mono text-[12px] leading-relaxed text-mp-ink">{groupDigestFingerprint(digest)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {link.ok && <CopyButton value={link.url} label="receipt handoff link" text="Copy link" />}
            <CopyButton value={digest} label="receipt fingerprint" text="Copy fingerprint" />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
            A matching fingerprint means the link was not edited after the sender copied the digest. It is not a
            signature, a timestamp proof or proof of payment.
          </p>
        </div>
      </div>
    </Card>
  )
}
