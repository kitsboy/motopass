import { useRef, useState } from 'react'
import { CheckCircle2, Download, FileJson, Upload } from 'lucide-react'
import { Card } from '../ui/Card'
import { parseReceiptBatch, serializeReceiptBatch, type ReceiptBatchResult } from '../../lib/receiptBatch'

function downloadJson(result: ReceiptBatchResult) {
  const blob = new Blob([serializeReceiptBatch(result)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'motopass-receipt-batch.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ReceiptBatchPanel() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<ReceiptBatchResult | null>(null)
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const readFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 2_000_000) {
      setMessage('That file is larger than 2 MB. Paste a smaller batch.')
      return
    }
    try {
      setRaw(await file.text())
      setResult(null)
      setMessage(`Read ${file.name} locally.`)
    } catch {
      setMessage('That file could not be read as text.')
    }
  }

  const check = () => {
    if (!raw.trim()) {
      setMessage('Paste a JSON array or drop a batch file first.')
      return
    }
    setResult(parseReceiptBatch(raw))
    setMessage('')
  }

  return (
    <Card
      id="receipt-batch"
      className={`p-4 transition-colors sm:p-6 ${dragging ? 'border-mp-btc/60 bg-mp-btc/5' : ''}`}
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
      <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
        <FileJson size={12} aria-hidden="true" /> Local batch check
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-mp-ink">Verify a bundle of receipts</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-mp-ink-tertiary">
        Drop a JSON array of receipt objects or <span className="font-mono">/tools/receipt#r=…</span> links. Every item
        is parsed and hashed in this tab; nothing is uploaded. A valid JSON receipt without a link digest is marked
        uncompared, not verified.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-mp-border-subtle px-3 py-1.5 font-chrome text-[10px] font-semibold text-mp-ink-secondary hover:border-mp-btc/40"
        >
          <Upload size={11} aria-hidden="true" /> Choose JSON file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json,text/plain"
          className="hidden"
          onChange={event => void readFile(event.target.files?.[0])}
        />
        <span className="text-[10px] text-mp-ink-tertiary">or drop it anywhere in this card</span>
      </div>

      <label htmlFor="receipt-batch-input" className="mt-3 block font-chrome text-[11px] font-semibold text-mp-ink-secondary">
        Receipt batch JSON
      </label>
      <textarea
        id="receipt-batch-input"
        value={raw}
        onChange={event => {
          setRaw(event.target.value)
          setResult(null)
          setMessage('')
        }}
        rows={5}
        spellCheck={false}
        placeholder={'[{"version":1,"app":"MotoPass",…},\n "https://motopass.giveabit.io/tools/receipt#r=…&h=…"]'}
        className="mt-1.5 w-full resize-y rounded-mp-md border border-mp-border bg-mp-canvas/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-btc/30"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={check}
          disabled={!raw.trim()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-mp-btc/40 px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-btc-text hover:bg-mp-btc/10 disabled:opacity-50"
        >
          <CheckCircle2 size={12} aria-hidden="true" /> Check batch
        </button>
        {result && (
          <button
            type="button"
            onClick={() => downloadJson(result)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-mp-border-subtle px-3 py-1.5 font-chrome text-[10px] font-semibold text-mp-ink-secondary hover:border-mp-btc/40"
          >
            <Download size={11} aria-hidden="true" /> Export summary
          </button>
        )}
      </div>
      {message && <p className="mt-2 text-[11px] text-mp-ink-tertiary">{message}</p>}

      {result && (
        <div className="mt-3" aria-live="polite">
          <p className="text-[11px] font-semibold text-mp-ink">
            {result.verified} verified · {result.edited} edited · {result.errors} errors
          </p>
          <div className="mt-2 overflow-x-auto rounded-mp-md border border-mp-border-subtle">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[11px]">
              <thead className="bg-mp-canvas/60 font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
                <tr>
                  <th className="px-2 py-1.5">#</th>
                  <th className="px-2 py-1.5">Receipt</th>
                  <th className="px-2 py-1.5">Tool</th>
                  <th className="px-2 py-1.5">Status</th>
                  <th className="px-2 py-1.5">Note</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map(row => (
                  <tr key={`${row.index}-${row.title}`} className="border-t border-mp-border-subtle/60">
                    <td className="px-2 py-1.5 text-mp-ink-tertiary">{row.index + 1}</td>
                    <td className="max-w-[13rem] px-2 py-1.5 text-mp-ink">{row.title}</td>
                    <td className="px-2 py-1.5 font-mono text-[10px] text-mp-ink-tertiary">{row.tool}</td>
                    <td
                      className={`px-2 py-1.5 font-semibold ${
                        row.status === 'verified'
                          ? 'text-mp-proof'
                          : row.status === 'edited'
                            ? 'text-mp-wax'
                            : 'text-mp-ink-tertiary'
                      }`}
                    >
                      {row.status}
                    </td>
                    <td className="px-2 py-1.5 text-mp-ink-tertiary">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
            “Verified” here means the receipt payload matches the digest carried by its link, or the JSON shape is
            valid. It is not a signature and not proof of payment.
          </p>
        </div>
      )}
    </Card>
  )
}
