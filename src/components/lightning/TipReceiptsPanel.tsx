import { useState } from 'react'
import { Check, Copy, RefreshCw, Trash2 } from 'lucide-react'
import {
  MAX_TIP_RECEIPTS,
  clearTipReceipts,
  loadTipReceipts,
  mergeTipReceipts,
  removeTipReceipt,
  type StoredTipReceipt,
} from '../../lib/tipReceiptStore'
import { fetchTipReceipts } from '../../lib/receiptRelays'
import { formatSatsExact } from '../../lib/satsAnchor'
import { ReceiptInspector } from './ReceiptInspector'

/**
 * Receipts this device holds, and a way to pull the same public events back
 * from relays by npub.
 *
 * The relay lookup needs no key: a receipt is a public kind-30078 event. Every
 * event that comes back is re-verified before it is merged, so a relay can add
 * nothing this browser has not checked itself. Nothing here totals sats.
 */

function eventJson(receipt: StoredTipReceipt): string {
  return JSON.stringify(
    {
      kind: receipt.kind,
      created_at: receipt.created_at,
      tags: receipt.tags,
      content: receipt.content,
      id: receipt.id,
      pubkey: receipt.pubkey,
      sig: receipt.sig,
    },
    null,
    2,
  )
}

function shortHash(hash: string | null): string {
  return hash ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : 'no payment hash'
}

export function TipReceiptsPanel() {
  const [receipts, setReceipts] = useState(() => loadTipReceipts())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [author, setAuthor] = useState('')
  const [lookup, setLookup] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null)
  const [lookupBusy, setLookupBusy] = useState(false)

  const copy = async (receipt: StoredTipReceipt) => {
    try {
      await navigator.clipboard.writeText(eventJson(receipt))
      setCopiedId(receipt.id)
      window.setTimeout(() => setCopiedId(current => (current === receipt.id ? null : current)), 2000)
    } catch {
      setCopiedId(null)
    }
  }

  const remove = (id: string) => {
    const result = removeTipReceipt(id)
    setReceipts(result.receipts)
    if (!result.ok) setLookup({ tone: 'warn', text: 'This browser refused to update the saved receipts.' })
  }

  const clear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clearTipReceipts()
    setReceipts([])
    setConfirmClear(false)
    setLookup(null)
  }

  const find = async () => {
    setLookupBusy(true)
    setLookup(null)
    const found = await fetchTipReceipts(author)
    if (!found.ok) {
      setLookup({ tone: 'warn', text: found.error })
      setLookupBusy(false)
      return
    }
    const merged = mergeTipReceipts(found.receipts)
    if (!merged.ok) {
      setLookup({ tone: 'warn', text: merged.error })
      setLookupBusy(false)
      return
    }
    setReceipts(merged.receipts)
    setLookup({
      tone: 'ok',
      text:
        found.receipts.length === 0
          ? 'Relays returned no gap-tip receipts for that key.'
          : merged.added === 0
            ? `Relays returned ${found.receipts.length} receipt${found.receipts.length === 1 ? '' : 's'} — all already saved here.`
            : `Added ${merged.added} verified receipt${merged.added === 1 ? '' : 's'} from relays.`,
    })
    setLookupBusy(false)
  }

  return (
    <section className="rounded-mp-lg border border-mp-border bg-section/40 p-4" aria-labelledby="tip-receipts-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="club-eyebrow mb-1 block">Payment evidence</span>
          <h2 id="tip-receipts-heading" className="font-display text-sm font-semibold text-mp-ink">
            Gap-tip receipts on this device
          </h2>
        </div>
        {receipts.length > 0 && (
          <button
            type="button"
            onClick={clear}
            onBlur={() => setConfirmClear(false)}
            className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[11px] text-mp-ink-tertiary hover:border-mp-wax/40 hover:text-mp-wax"
          >
            <Trash2 size={11} aria-hidden="true" />
            {confirmClear ? 'Confirm clear' : 'Clear all'}
          </button>
        )}
      </div>

      <p className="mt-1.5 text-[11px] leading-relaxed text-mp-ink-tertiary">
        Each receipt is a signed public event, kept in this browser only (up to {MAX_TIP_RECEIPTS}) and re-verified on
        load. Sats are listed per receipt and never added up here.
      </p>

      {receipts.length === 0 ? (
        <p className="mt-3 text-[11px] text-mp-ink-tertiary">
          No receipts saved yet. Publish one from a gap tip, or find the ones you already published with the lookup
          below.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-mp-border-subtle/60">
          {receipts.map(receipt => (
            <li key={receipt.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2">
              <span className="font-mono text-[10px] text-mp-ink-tertiary">
                {new Date(receipt.created_at * 1000).toISOString().slice(0, 10)}
              </span>
              <span className="min-w-0 flex-1 text-[11px] text-mp-ink-secondary">
                {receipt.program ?? 'program not tagged'} · {receipt.field ?? 'field not tagged'}
              </span>
              <span className="font-mono text-[10px] text-mp-ink">
                {receipt.sats != null ? formatSatsExact(receipt.sats) : 'amount not tagged'}
              </span>
              <span className="font-mono text-[9px] text-mp-ink-tertiary">{shortHash(receipt.paymentHash)}</span>
              <span className="text-[9px] font-semibold text-mp-proof">signed</span>
              <button
                type="button"
                onClick={() => void copy(receipt)}
                className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
              >
                {copiedId === receipt.id ? <Check size={9} aria-hidden="true" /> : <Copy size={9} aria-hidden="true" />}
                {copiedId === receipt.id ? 'Copied' : 'Copy JSON'}
              </button>
              <button
                type="button"
                onClick={() => remove(receipt.id)}
                aria-label="Remove this receipt from this device"
                className="rounded-full border border-mp-border px-1.5 py-0.5 text-mp-ink-tertiary hover:border-mp-wax/40 hover:text-mp-wax"
              >
                <Trash2 size={9} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={event => {
          event.preventDefault()
          void find()
        }}
        className="mt-3 border-t border-mp-border-subtle pt-3"
      >
        <label htmlFor="receipt-author" className="font-chrome text-[10px] font-semibold text-mp-ink-secondary">
          Find your published receipts
        </label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <input
            id="receipt-author"
            value={author}
            onChange={event => setAuthor(event.target.value)}
            placeholder="npub1… or your public key"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-full border border-mp-border bg-mp-card px-3 py-1.5 font-mono text-[11px] text-mp-ink placeholder:text-mp-ink-tertiary focus:border-mp-btc/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={lookupBusy || !author.trim()}
            className="inline-flex items-center gap-1.5 rounded-full border border-mp-btc/40 px-3 py-1.5 font-chrome text-[11px] font-semibold text-mp-btc-text hover:bg-mp-btc/10 disabled:opacity-50"
          >
            <RefreshCw size={11} aria-hidden="true" />
            {lookupBusy ? 'Reading relays…' : 'Find receipts'}
          </button>
        </div>
        <p className="mt-1 text-[9px] leading-relaxed text-mp-ink-tertiary">
          Read-only relay query by author. Signatures are re-checked here before anything is merged, and the query
          sends no wallet data.
        </p>
        {lookup && (
          <p className={lookup.tone === 'ok' ? 'mt-1 text-[10px] text-mp-proof' : 'mt-1 text-[10px] text-mp-wax'}>
            {lookup.text}
          </p>
        )}
      </form>

      <div className="mt-3">
        <ReceiptInspector />
      </div>
    </section>
  )
}
