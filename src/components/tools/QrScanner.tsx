import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, ScanLine, X } from 'lucide-react'
import { cleanScannedText } from '../../lib/qrScan'

interface DetectedBarcode {
  rawValue: string
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

/**
 * Camera QR input using the browser's native BarcodeDetector.
 *
 * No image or frame leaves the tab, and there is no QR library in the bundle.
 * Browsers without BarcodeDetector get an honest paste fallback instead of a
 * camera button that silently does nothing.
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
    let stream: MediaStream | null = null
    let timer: number | undefined
    const video = videoRef.current

    const start = async () => {
      setError(null)
      setScanning(true)
      const Ctor = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
      if (!Ctor) {
        setError('This browser cannot read QR codes. Paste the invoice, address or PSBT instead — no data has left this tab.')
        setScanning(false)
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is unavailable. Open this page on HTTPS and allow camera permission, or paste the value.')
        setScanning(false)
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled || !video) {
          stream.getTracks().forEach(track => track.stop())
          return
        }
        video.srcObject = stream
        await video.play()
        let detector: BarcodeDetectorLike
        try {
          detector = new Ctor({ formats: ['qr_code'] })
        } catch {
          detector = new Ctor()
        }
        const scan = async () => {
          if (cancelled || !video || video.readyState < 2) {
            timer = window.setTimeout(scan, 300)
            return
          }
          try {
            const codes = await detector.detect(video)
            const value = codes.find(code => code.rawValue.trim())?.rawValue
            if (value) {
              onScanRef.current(cleanScannedText(value))
              setOpen(false)
              return
            }
          } catch {
            // A transient detector failure should not close the camera.
          }
          timer = window.setTimeout(scan, 300)
        }
        timer = window.setTimeout(scan, 300)
      } catch (err) {
        const name = err instanceof DOMException ? err.name : ''
        setError(
          name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow it in the browser, or paste the value.'
            : name === 'NotFoundError'
              ? 'No camera was found. Paste the value instead.'
              : 'The camera could not start. Paste the value instead.',
        )
        setScanning(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    void start()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
      stream?.getTracks().forEach(track => track.stop())
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-full border border-mp-border-subtle px-2.5 py-1.5 font-chrome text-[10px] font-semibold text-mp-ink-tertiary hover:border-mp-btc/40 hover:text-mp-btc-text focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/40 ${className}`}
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
                  className="rounded-full border border-mp-border-subtle p-2 text-mp-ink-secondary"
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
                  Hold the code inside the frame. Camera frames are processed in this tab and are never uploaded.
                </p>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 w-full rounded-full border border-mp-border-subtle px-3 py-2 text-[11px] font-semibold text-mp-ink-secondary"
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
