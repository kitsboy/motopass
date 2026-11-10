import { useMemo, useState } from 'react'
import { Check, Copy, Radio } from 'lucide-react'
import type { Program } from '../programs/types'
import {
  buildAuditLedgerEvents,
  publishAuditLedger,
  type LedgerPublishResult,
  type LedgerSigner,
} from '../../lib/nostrLedger'
import { anchorLedger, anchorStatusLabel, type LedgerAnchorResult } from '../../lib/ledgerAnchor'
import { hasNostrExtension } from '../../lib/nostr'
import { RemoteSigner } from './RemoteSigner'

/**
 * Publish this record's audit rows as a signed NOSTR ledger, then anchor the
 * set to Bitcoin.
 *
 * The events are signed by the visitor's key — a NIP-07 extension or a NIP-46
 * remote signer. MotoPass holds no signing key, so the signature proves who
 * republished the row, not that MotoPass approved it; the row's source link is
 * still the evidence. The anchor is one Satohash stamp over the sorted digest
 * of the signed event ids: it proves that set existed by a block, nothing more.
 */
export function LedgerPublish({ program }: { program: Program }) {
  const entries = useMemo(() => buildAuditLedgerEvents(program).length, [program])
  const [remote, setRemote] = useState<{ sign: LedgerSigner; pubkey: string } | null>(null)
  const [result, setResult] = useState<LedgerPublishResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [anchor, setAnchor] = useState<LedgerAnchorResult | null>(null)
  const [anchoring, setAnchoring] = useState(false)

  const signedIds = result?.signedIds ?? []

  const publish = async () => {
    setBusy(true)
    setAnchor(null)
    setResult(await publishAuditLedger(program, remote ? { signer: remote.sign } : {}))
    setBusy(false)
  }

  const anchorNow = async () => {
    if (signedIds.length === 0) return
    setAnchoring(true)
    setAnchor(await anchorLedger(signedIds))
    setAnchoring(false)
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
    <div className="space-y-2">
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

        {remote && (
          <p className="mt-1.5 font-mono text-[10px] text-mp-ink-tertiary">
            signing with remote npub {remote.pubkey.slice(0, 10)}…
          </p>
        )}

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
                No signer connected. The events are built and valid — copy the JSON and publish it from any Nostr
                client, or connect a signer below.
              </p>
            )}
            {result.status === 'rejected' && (
              <p className="text-[11px] text-mp-wax">{result.error ?? 'The signer refused the events.'}</p>
            )}
            {result.status === 'empty' && (
              <p className="text-[11px] text-mp-ink-tertiary">Nothing to publish — no rows carry a date.</p>
            )}
            {(result.status === 'unsigned' ||
              result.status === 'signed-unpublished' ||
              result.status === 'published') && (
              <button
                type="button"
                onClick={() => void copyJson()}
                className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[11px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
              >
                {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy event JSON'}
              </button>
            )}

            {signedIds.length > 0 && (
              <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] leading-relaxed text-mp-ink-tertiary">
                    {signedIds.length} signed {signedIds.length === 1 ? 'event' : 'events'} can be committed to
                    Bitcoin with one stamp.
                  </p>
                  <button
                    type="button"
                    onClick={() => void anchorNow()}
                    disabled={anchoring}
                    className="rounded-full border border-mp-btc/40 px-2.5 py-1 font-chrome text-[10px] font-semibold text-mp-btc-text hover:bg-mp-btc/10 disabled:opacity-50"
                  >
                    {anchoring ? 'Stamping…' : anchor ? 'Check again' : 'Anchor to Bitcoin'}
                  </button>
                </div>

                {anchor && (
                  <div className="mt-1.5 space-y-1">
                    {anchor.root && (
                      <p className="font-mono text-[9px] break-all text-mp-ink-tertiary">root {anchor.root}</p>
                    )}
                    <p className={`text-[10px] ${anchor.blockHeight != null ? 'text-mp-proof' : 'text-mp-ink-secondary'}`}>
                      {anchor.ok ? anchorStatusLabel(anchor.blockHeight, anchor.status) : anchor.error}
                    </p>
                    {anchor.verifyUrl && (
                      <a
                        href={anchor.verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-accent hover:underline"
                      >
                        Check the proof on Satohash ↗
                      </a>
                    )}
                    <p className="text-[9px] leading-relaxed text-mp-ink-tertiary">
                      One stamp commits the sorted digest of these ids. It proves the set existed by that block — not
                      that a row is true, and not that each id was stamped separately.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="mt-2 border-t border-mp-border-subtle pt-2 text-[10px] leading-relaxed text-mp-ink-tertiary">
          Signed by your key, not by MotoPass — this project holds no signing key for your events. The signature
          records who republished the row; the source link is still the evidence.
        </p>
      </div>

      {!hasNostrExtension() && entries > 0 && (
        <RemoteSigner
          onSigner={(sign, pubkey) => setRemote(sign && pubkey ? { sign, pubkey } : null)}
        />
      )}
    </div>
  )
}
