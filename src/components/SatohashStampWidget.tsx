import { useEffect } from 'react'

const SCRIPT_SRC = 'https://satohash.io/widgets/stamp.js'

declare global {
  interface Window {
    SatohashStamp?: { init: () => void }
  }
}

/**
 * Drop-in Satohash stamp: hash stays on-device, X-Satohash-Client=motopass.
 * Loads stamp.js once; default mode opens /stamp?hash=&ref=motopass (file never uploaded).
 */
export function SatohashStampWidget() {
  useEffect(() => {
    const boot = () => {
      window.SatohashStamp?.init?.()
    }
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      boot()
      return undefined
    }
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = boot
    document.body.appendChild(s)
    return undefined
  }, [])

  return (
    <div id="satohash-stamp" className="max-w-[360px]">
      <p className="text-xs text-ink-muted mb-2 leading-snug">
        Bitcoin proof of existence — file stays on your device
      </p>
      <div data-satohash-stamp="" data-client="motopass" data-label="MotoPass" data-theme="jewel" />
    </div>
  )
}
