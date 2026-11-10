import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, FileCheck2, History } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { verificationAnchor } from '../lib/verificationHistory'
import {
  parseReceiptShareHash,
  parseVerificationReceipt,
  verificationReceiptDigest,
  type VerificationReceipt,
} from '../lib/verificationReceipt'

type Loaded =
  | {
      ok: true
      receipt: VerificationReceipt
      digest: string
      providedDigest: string | null
      hashMatches: boolean
    }
  | { ok: false; error: string }

function loadFromHash(hash: string): Loaded | null {
  if (!hash.includes('r=')) return null
  return parseReceiptShareHash(hash)
}

function loadFromJson(raw: string): Loaded {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'That is not valid JSON' }
  }
  const receipt = parseVerificationReceipt(parsed)
  if (!receipt.ok) return receipt
  return {
    ok: true,
    receipt: receipt.receipt,
    digest: verificationReceiptDigest(receipt.receipt),
    providedDigest: null,
    hashMatches: true,
  }
}

export function ReceiptPage() {
  const [loaded, setLoaded] = useState<Loaded | null>(() =>
    typeof window === 'undefined' ? null : loadFromHash(window.location.hash),
  )
  const [raw, setRaw] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const sync = () => {
      const next = loadFromHash(window.location.hash)
      if (next) {
        setLoaded(next)
        setShowPaste(false)
      }
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const verifyPaste = () => {
    const text = raw.trim()
    if (!text) {
      setMessage('Paste a receipt link or receipt JSON first.')
      return
    }
    if (text.includes('#') || text.startsWith('http')) {
      try {
        const url = new URL(text, window.location.origin)
        const next = loadFromHash(url.hash)
        if (!next) {
          setMessage('That link has no receipt payload.')
          return
        }
        setLoaded(next)
      } catch {
        setMessage('That link could not be read.')
        return
      }
    } else {
      setLoaded(loadFromJson(text))
    }
    setMessage('')
    setShowPaste(false)
  }

  const fields = useMemo(() => {
    if (!loaded?.ok) return []
    return Object.entries(loaded.receipt.fields ?? {})
  }, [loaded])

  return (
    <div className="page-container mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="RECEIPT VERIFIER"
        title="Check a shared receipt"
        subtitle="The receipt travels in the URL fragment and never reaches a server. This page recomputes its canonical SHA-256 digest and shows exactly what the receipt does and does not prove."
        actions={
          <Link to="/tools" className="chip min-h-9 text-xs">
            Back to tools →
          </Link>
        }
      />

      {!loaded && (
        <Card className="p-4 sm:p-6">
          <div className="flex items-start gap-2">
            <FileCheck2 size={16} className="mt-0.5 text-mp-btc" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg font-semibold text-mp-ink">No receipt in this link</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-mp-ink-tertiary">
                A shared receipt looks like <span className="font-mono">/tools/receipt#r=…&amp;h=…</span>. You can also
                paste the receipt JSON below.
              </p>
            </div>
          </div>
        </Card>
      )}

      {loaded && !loaded.ok && (
        <Card className="border-mp-wax/40 p-4 sm:p-6">
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-mp-wax">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {loaded.error}
          </p>
        </Card>
      )}

      {loaded?.ok && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
                  {loaded.receipt.tool} · {new Date(loaded.receipt.generatedAt).toISOString()}
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-mp-ink">{loaded.receipt.title}</h2>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 font-chrome text-[10px] font-semibold uppercase tracking-wide ${
                  loaded.hashMatches
                    ? 'border-mp-proof-border text-mp-proof'
                    : 'border-mp-wax/40 text-mp-wax'
                }`}
              >
                {loaded.providedDigest ? (loaded.hashMatches ? 'digest matches' : 'digest mismatch') : 'decoded, no digest'}
              </span>
            </div>

            <div className="mt-3 rounded-mp-md border border-mp-border-subtle bg-mp-canvas/40 p-2.5">
              <p className="font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">
                Canonical SHA-256
              </p>
              <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-mp-ink-secondary">{loaded.digest}</p>
              {loaded.providedDigest && (
                <p className="mt-1 text-[11px] leading-relaxed text-mp-ink-tertiary">
                  {loaded.hashMatches
                    ? 'The encoded receipt still hashes to the digest carried in the link.'
                    : 'The encoded receipt does not hash to the digest carried in the link. Treat it as edited.'}
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {loaded.receipt.steps.map((step, index) => (
                <span
                  key={`${step.label}-${index}`}
                  className={`rounded-full border px-2 py-1 font-chrome text-[10px] uppercase tracking-wide ${
                    step.state === 'pass'
                      ? 'border-mp-proof-border text-mp-proof'
                      : step.state === 'fail'
                        ? 'border-mp-wax/40 text-mp-wax'
                        : 'border-mp-border-subtle text-mp-ink-tertiary'
                  }`}
                >
                  {step.label} · {step.state === 'unknown' ? 'unchecked' : step.state}
                </span>
              ))}
            </div>

            {fields.length > 0 && (
              <dl className="mt-3 grid gap-1 border-t border-mp-border-subtle/60 pt-2">
                {fields.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2 py-0.5">
                    <dt className="text-[11px] uppercase tracking-wide text-mp-ink-tertiary">{key}</dt>
                    <dd className="min-w-0 break-words text-[12px] text-mp-ink-secondary">{String(value ?? '—')}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-[0.14em] text-mp-ink-tertiary">
              <History size={12} aria-hidden="true" /> What this receipt cannot prove
            </p>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-mp-ink-tertiary">
              {loaded.receipt.limits.map(limit => (
                <li key={limit}>• {limit}</li>
              ))}
              <li>• A digest match only shows the receipt was not edited after the link was made. It is not proof of payment.</li>
            </ul>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-mp-ink-tertiary">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-mp-proof" aria-hidden="true" />
              To compare the digest out of band, ask the sender for the SHA-256 printed on the proof card or receipt JSON.
            </p>
            <Link
              to={`/tools#${verificationAnchor(loaded.receipt.tool)}`}
              className="mt-3 inline-flex min-h-10 items-center rounded-full border border-mp-btc/40 px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-btc-text hover:bg-mp-btc/10"
            >
              Open the tool that made this receipt →
            </Link>
          </Card>
        </div>
      )}

      <div className="mt-4">
        {!showPaste ? (
          <button
            type="button"
            onClick={() => setShowPaste(true)}
            className="min-h-10 font-chrome text-[11px] font-semibold uppercase tracking-wide text-mp-ink-tertiary underline underline-offset-4 hover:text-mp-ink"
          >
            Paste a receipt link or JSON instead
          </button>
        ) : (
          <Card className="p-4">
            <label htmlFor="receipt-share-paste" className="block font-chrome text-[11px] font-semibold text-mp-ink-secondary">
              Receipt link or JSON
            </label>
            <textarea
              id="receipt-share-paste"
              value={raw}
              onChange={event => setRaw(event.target.value)}
              rows={5}
              spellCheck={false}
              placeholder="/tools/receipt#r=…&amp;h=… or {&quot;version&quot;:1,…}"
              className="mt-2 w-full resize-y rounded-mp-md border border-mp-border bg-mp-canvas/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-mp-ink focus:border-mp-btc/60 focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={verifyPaste}
                className="min-h-10 rounded-full border border-mp-btc/40 px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-btc-text hover:bg-mp-btc/10"
              >
                Check receipt
              </button>
              <button
                type="button"
                onClick={() => setShowPaste(false)}
                className="min-h-10 px-2 text-[11px] text-mp-ink-tertiary underline underline-offset-2"
              >
                Cancel
              </button>
            </div>
            {message && <p className="mt-2 text-[11px] text-mp-wax">{message}</p>}
          </Card>
        )}
      </div>
    </div>
  )
}
