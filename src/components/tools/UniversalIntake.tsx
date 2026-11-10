import { useRef, useState } from 'react'
import { ClipboardPaste, FileText, ScanLine, X } from 'lucide-react'
import { detectTool } from '../../lib/toolIntake'
import { QrScanButton } from './QrScanner'
import { prefillTool } from './toolsShared'

export function UniversalIntake({ onSelect }: { onSelect: (id: string) => void }) {
  const [raw, setRaw] = useState('')
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const detection = detectTool(raw)

  const choose = (id: string) => {
    if (!detection) return
    prefillTool(id, detection.value)
    onSelect(id)
    setNotice(`Opened the ${detection.label.toLowerCase()} card with this value.`)
  }

  const readFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 2_000_000) {
      setNotice('That file is larger than 2 MB. Paste the relevant text instead.')
      return
    }
    try {
      const text = await file.text()
      setRaw(text)
      setNotice(`Read ${file.name} in this tab.`)
    } catch {
      setNotice('That file could not be read as text.')
    }
  }

  return (
    <section
      aria-label="Paste any artifact"
      className={`mb-4 rounded-mp-lg border bg-mp-card/40 p-3 transition-colors ${
        dragging ? 'border-mp-btc/60 bg-mp-btc/5' : 'border-mp-border-subtle'
      }`}
      onDragOver={event => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        event.preventDefault()
        setDragging(false)
        void readFile(event.dataTransfer.files[0])
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 font-chrome text-[11px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
            <ClipboardPaste size={12} aria-hidden="true" /> Start here
          </p>
          <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight text-mp-ink">Paste anything</h2>
        </div>
        <span className="rounded-full border border-mp-proof-border px-2 py-1 font-chrome text-[10px] uppercase tracking-wide text-mp-proof">
          Local detect
        </span>
      </div>

      <label htmlFor="universal-tool-input" className="mt-2 block text-[12px] font-semibold text-mp-ink-secondary">
        Invoice, BOLT12, PSBT, address, signed message, zap or DM event, LNURL or NIP-05 name
      </label>
      <textarea
        id="universal-tool-input"
        value={raw}
        onChange={event => {
          setRaw(event.target.value)
          setNotice('')
        }}
        rows={3}
        spellCheck={false}
        placeholder="Paste here, drop a text file, or scan a QR code"
        className="mt-1.5 w-full resize-y rounded-mp-md border border-mp-border bg-mp-canvas/60 px-3 py-2 font-mono text-[12px] leading-relaxed text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/30"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <QrScanButton onScan={setRaw} label="Scan QR" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-mp-border-subtle px-2.5 py-1.5 font-chrome text-[10px] font-semibold text-mp-ink-tertiary hover:border-mp-btc/40 hover:text-mp-btc-text"
        >
          <FileText size={11} aria-hidden="true" /> Read a file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.json,.psbt,text/plain,application/json"
          className="hidden"
          onChange={event => void readFile(event.target.files?.[0])}
        />
        {raw && (
          <button
            type="button"
            onClick={() => {
              setRaw('')
              setNotice('')
            }}
            className="inline-flex min-h-9 items-center gap-1 rounded-full px-2 py-1 font-chrome text-[10px] font-semibold text-mp-ink-tertiary hover:text-mp-ink"
          >
            <X size={11} aria-hidden="true" /> Clear
          </button>
        )}
        <span className="ml-auto text-[11px] text-mp-ink-tertiary">Only LNURL and NIP-05 can call the network, after you press Inspect.</span>
      </div>

      <div aria-live="polite" className="mt-2">
        {detection ? (
          <div className="flex flex-wrap items-center gap-2 rounded-mp-md border border-mp-proof-border bg-mp-proof/5 p-2">
            <ScanLine size={12} className="text-mp-proof" aria-hidden="true" />
            <span className="text-[12px] font-semibold text-mp-ink">Detected: {detection.label}</span>
            <button
              type="button"
              onClick={() => choose(detection.id)}
              className="min-h-9 rounded-full border border-mp-btc/40 px-3 py-1 font-chrome text-[10px] font-semibold text-mp-btc-text hover:bg-mp-btc/10"
            >
              Open card
            </button>
            {detection.alternates?.map(alternate => (
              <button
                key={alternate.id}
                type="button"
                onClick={() => choose(alternate.id)}
                className="min-h-9 rounded-full border border-mp-border-subtle px-3 py-1 font-chrome text-[10px] font-semibold text-mp-ink-secondary hover:border-mp-btc/40"
              >
                Treat as {alternate.label}
              </button>
            ))}
          </div>
        ) : (
          raw.trim() && (
            <p className="rounded-mp-md border border-mp-border-subtle px-2.5 py-2 text-[11px] leading-relaxed text-mp-ink-tertiary">
              No known local format detected. Choose a card below, or check that the value was copied completely.
            </p>
          )
        )}
        {notice && <p className="mt-1.5 text-[11px] leading-relaxed text-mp-ink-tertiary">{notice}</p>}
      </div>
    </section>
  )
}
