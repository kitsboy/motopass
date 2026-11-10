import { useMemo, useState } from 'react'
import { Check, Copy, Radio } from 'lucide-react'
import type { Program } from '../programs/types'
import { buildAuditLedgerEvents, publishAuditLedger, type LedgerPublishResult } from '../../lib/nostrLedger'

/**
 * Publish this record's audit rows as a signed NOSTR ledger.
 *
 * The events are signed by the visitor's npub — MotoPass holds no signing key.
 * That means the signature proves who republished the row, not that MotoPass
 * approved it; the row's source link is still the evidence. Without a NIP-07
 * extension the JSON is offered for publication elsewhere rather than a fake
 * "published" state.
 */
export function LedgerPublish({ program }: { program: Program }) {
  const entries = useMemo(() => buildAuditLedgerEvents(program).length, [program])
  const [result, setResult] = useState<LedgerPublishResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const publish = async () => {
    setBusy(true)
    setResult(await publishAuditLedger(program))
    setBusy(false)
  }

  const copyJson = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.json)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-mp-md border border-mp-border bg-section/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-chrome text-[11px] font-semibold uppercase tracking-wide text-mp-ink-secondary">
            Public ledger
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-mp-ink-tertiary">
            {entries > 0
              ? `${entries} dated audit ${entries === 1 ? 'row' : 'rows'} as kind-30078 events, timestamped with the row's own date.`
              : 'No dated audit rows to publish yet.'}
          </p>
        </div>
        {entries > 0 && (
          <button
            type="button"
            onClick={() => void publish()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-mp-border px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-ink-secondary transition-colors hover:border-mp-btc/40 hover:text-mp-btc-text disabled:opacity-50"
          >
            <Radio size={11} aria-hidden="true" />
            {busy ? 'Signing…' : result ? 'Publish again' : 'Publish to Nostr'}
          </button>
        )}
      </div>

      {result && (
        <div className="mt-2 space-y-2">
          {result.status === 'published' && (
            <p className="text-[11px] text-mp-proof">
              {result.signedCount} signed · {result.publishedCount} relay-accepted
              {result.relaySummary ? ` · ${result.relaySummary}` : ''}
            </p>
          )}
          {result.status === 'signed-unpublished' && (
            <p className="text-[11px] text-mp-wax">
              Signed locally but no relay accepted. {result.error}
            </p>
          )}
          {result.status === 'unsigned' && (
            <p className="text-[11px] leading-relaxed text-mp-ink-tertiary">
              No NIP-07 signer in this browser. The events are built and valid — copy the JSON and
              publish it from any Nostr client.
            </p>
          )}
          {result.status === 'rejected' && (
            <p className="text-[11px] text-mp-wax">{result.error ?? 'The signer refused the events.'}</p>
          )}
          {result.status === 'empty' && (
            <p className="text-[11px] text-mp-ink-tertiary">Nothing to publish — no rows carry a date.</p>
          )}
          {(result.status === 'unsigned' || result.status === 'signed-unpublished' || result.status === 'published') && (
            <button
              type="button"
              onClick={() => void copyJson()}
              className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[11px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
            >
              {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy event JSON'}
            </button>
          )}
        </div>
      )}

      <p className="mt-2 border-t border-mp-border-subtle pt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
        Signed by your npub, not by MotoPass — this project holds no signing key for your events. The
        signature records who republished the row; the source link is still the evidence.
      </p>
    </div>
  )
}
