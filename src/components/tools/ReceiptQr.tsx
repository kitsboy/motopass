import { lazy, Suspense } from 'react'

const QRCodeSVG = lazy(() => import('qrcode.react').then(module => ({ default: module.QRCodeSVG })))

/** QR rendering for a receipt link. Oversized receipts keep the copyable link instead. */
export function ReceiptQr({ url, label, size = 176 }: { url: string; label: string; size?: number }) {
  if (url.length > 1800) {
    return (
      <p className="rounded-mp-md border border-mp-border-subtle bg-mp-canvas/40 p-2 text-[11px] leading-relaxed text-mp-ink-tertiary">
        This receipt is too large for a reliable QR code. Copy the link or compare the SHA-256 fingerprint instead.
      </p>
    )
  }
  return (
    <div className="inline-flex flex-col items-center rounded-mp-md border border-mp-border-subtle bg-white p-2">
      <Suspense fallback={<div style={{ width: size, height: size }} aria-hidden="true" />}>
        <QRCodeSVG value={url} size={size} level="L" marginSize={2} bgColor="#ffffff" fgColor="#18181b" title={label} />
      </Suspense>
    </div>
  )
}
