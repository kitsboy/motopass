import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, ScanLine, X } from 'lucide-react'
import { cleanScannedText } from '../../lib/qrScan'

/**
 * Camera QR input.
 *
 * qr-scanner is loaded only when the camera is opened. It uses the native
 * BarcodeDetector where available and its own worker-based decoder elsewhere,
 * so the initial bundle stays lean and Safari / Firefox get camera input too.
 * No image or frame leaves the tab.
 */
export function QrScanButton({
  onScan,
  label = 'Scan QR',
  className = '',
}: {
  onScan: (value: string) => void
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const onScanRef = useRef(onScan)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    let scanner: { start: () => Promise<void>; destroy: () => void } | null = null
    const video = videoRef.current

    const start = async () => {
      setError(null)
      setScanning(true)
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is unavailable. Open this page on HTTPS and allow camera permission, or paste the value.')
        setScanning(false)
        return
      }
      try {
        const { default: QrScanner } = await import('qr-scanner')
        if (cancelled || !video) return
        scanner = new QrScanner(
          video,
          result => {
            onScanRef.current(cleanScannedText(result.data))
            setOpen(false)
          },
          {
            preferredCamera: 'environment',
            maxScansPerSecond: 4,
            returnDetailedScanResult: true,
            onDecodeError: () => {
              // A frame without a QR code is normal; keep scanning.
            },
          },
        )
        await scanner.start()
      } catch (err) {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : ''
        setError(
          name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow it in the browser, or paste the value.'
            : name === 'NotFoundError'
              ? 'No camera was found. Paste the value instead.'
              : 'The camera or local QR decoder could not start. Paste the value instead — no frame has left this tab.',
        )
        setScanning(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    void start()

    return () => {
      cancelled = true
      scanner?.destroy()
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-9 items-center gap-1 rounded-full border border-mp-border-subtle px-2.5 py-1.5 font-chrome text-[10px] font-semibold text-mp-ink-tertiary hover:border-mp-btc/40 hover:text-mp-btc-text focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40 ${className}`}
      >
        <ScanLine size={11} aria-hidden="true" />
        {label}
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Scan a QR code"
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-4 sm:items-center"
          >
            <div className="w-full max-w-md rounded-mp-lg border border-mp-border-strong bg-mp-canvas p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">Camera input</p>
                  <h2 className="font-display text-lg font-semibold text-mp-ink">Scan a QR code</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close camera"
                  className="min-h-11 min-w-11 rounded-full border border-mp-border-subtle p-2 text-mp-ink-secondary"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-mp-md border border-mp-border-subtle bg-black">
                <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
                {scanning && !error && (
                  <div className="pointer-events-none absolute inset-6 rounded-mp-md border-2 border-mp-btc/70" aria-hidden="true" />
                )}
              </div>
              {error ? (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-wax">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : (
                <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
                  Hold the code inside the frame. Camera frames are processed in this tab by the native detector or a
                  lazy-loaded local decoder, and are never uploaded.
                </p>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 min-h-11 w-full rounded-full border border-mp-border-subtle px-3 py-2 text-[11px] font-semibold text-mp-ink-secondary"
              >
                Paste instead
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
