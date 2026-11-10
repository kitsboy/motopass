import { useState } from 'react'
import { Check, Copy, ExternalLink, Receipt } from 'lucide-react'
import {
  nwcListTransactions,
  nwcLookupInvoice,
  nwcMakeInvoice,
  type NwcInvoice,
  type NwcInvoiceStatus,
  type NwcTransaction,
} from '../../lib/nwc'
import { bountyMemo } from '../../lib/bounties'
import { formatSatsExact } from '../../lib/satsAnchor'
import {
  buildTipReceipt,
  canIssueReceipt,
  publishTipReceipt,
  receiptEvidenceLine,
  type ReceiptPublishResult,
} from '../../lib/tipReceipt'
import { PaymentQrCode } from '../ui/PaymentQrCode'

/**
 * Settle a gap tip through the visitor's own wallet and record it.
 *
 * The invoice comes from the wallet, and the settlement answer comes from the
 * same wallet — MotoPass has no node watching the chain of events. Only a
 * wallet-reported `paid` unlocks the receipt, and the receipt is signed by the
 * payer, not by MotoPass and not by the receiving node.
 */

type Activity =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; error: string }
  | { phase: 'ready'; transactions: NwcTransaction[] }

type Phase =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'invoice'; invoice: NwcInvoice }
  | { phase: 'checking'; invoice: NwcInvoice }
  | { phase: 'settled'; invoice: NwcInvoice; status: NwcInvoiceStatus }
  | { phase: 'open'; invoice: NwcInvoice; status: NwcInvoiceStatus }
  | { phase: 'error'; error: string }

export function TipReceipt({
  nwcUri,
  factKey,
  programName,
  countryCode,
  sats,
}: {
  nwcUri: string
  factKey: string
  programName: string
  countryCode?: string
  sats: number
}) {
  const [state, setState] = useState<Phase>({ phase: 'idle' })
  const [receipt, setReceipt] = useState<ReceiptPublishResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<'invoice' | 'json' | null>(null)
  const [activity, setActivity] = useState<Activity>({ phase: 'idle' })

  const request = async () => {
    setState({ phase: 'loading' })
    setReceipt(null)
    const created = await nwcMakeInvoice(nwcUri, { sats, memo: bountyMemo(factKey, programName) })
    if (!created.ok) {
      setState({ phase: 'error', error: created.error })
      return
    }
    setState({ phase: 'invoice', invoice: created.invoice })
  }

  const check = async (invoice: NwcInvoice) => {
    setState({ phase: 'checking', invoice })
    const status = await nwcLookupInvoice(nwcUri, invoice.paymentHash)
    if (!status.ok) {
      setState({ phase: 'error', error: status.error })
      return
    }
    setState(
      canIssueReceipt(status.status.state)
        ? { phase: 'settled', invoice, status: status.status }
        : { phase: 'open', invoice, status: status.status },
    )
  }

  const copy = async (kind: 'invoice' | 'json', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(current => (current === kind ? null : current)), 2000)
    } catch {
      setCopied(null)
    }
  }

  const loadActivity = async () => {
    setActivity({ phase: 'loading' })
    const listed = await nwcListTransactions(nwcUri, { limit: 10 })
    setActivity(
      listed.ok
        ? { phase: 'ready', transactions: listed.transactions }
        : { phase: 'error', error: listed.error },
    )
  }

  const publish = async (invoice: NwcInvoice, status: NwcInvoiceStatus) => {
    const paidSats =
      status.amountPaidMsat != null && status.amountPaidMsat > 0
        ? Math.round(status.amountPaidMsat / 1000)
        : sats
    const built = buildTipReceipt({
      program: programName,
      countryCode,
      factKey,
      sats: paidSats,
      paymentHash: invoice.paymentHash,
      preimage: status.preimage,
      invoice: invoice.bolt11,
      settledAt: status.settledAt,
    })
    if (!built.ok) {
      setState({ phase: 'error', error: built.error })
      return
    }
    setBusy(true)
    setReceipt(await publishTipReceipt(built.event))
    setBusy(false)
  }

  const receiptHash = receipt?.event.tags.find(tag => tag[0] === 'payment_hash')?.[1] ?? null

  return (
    <div className="mt-2 rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
      <p className="flex items-center gap-1.5 font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">
        <Receipt size={10} aria-hidden="true" /> Settle with your wallet
      </p>

      {state.phase === 'idle' && (
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-sm text-[10px] leading-relaxed text-mp-ink-tertiary">
            Your wallet issues the invoice and reports settlement, so a receipt can say what was actually paid.
          </p>
          <button
            type="button"
            onClick={() => void request()}
            className="rounded-full border border-mp-btc/40 px-2.5 py-1 font-chrome text-[11px] font-semibold text-mp-btc-text hover:bg-mp-btc/10"
          >
            Get wallet invoice
          </button>
        </div>
      )}

      {state.phase === 'loading' && <p className="mt-1.5 text-[10px] text-mp-ink-tertiary">Asking your wallet…</p>}

      {state.phase === 'error' && (
        <div className="mt-1.5 space-y-1">
          <p className="text-[10px] text-mp-wax">{state.error}</p>
          <button type="button" onClick={() => setState({ phase: 'idle' })} className="text-[10px] text-accent hover:underline">
            Try again
          </button>
        </div>
      )}

      {(state.phase === 'invoice' || state.phase === 'checking' || state.phase === 'open' || state.phase === 'settled') && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <PaymentQrCode
              value={state.invoice.bolt11}
              label={formatSatsExact(
                state.invoice.amountMsat != null ? Math.round(state.invoice.amountMsat / 1000) : sats,
              )}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="break-all font-mono text-[10px] leading-relaxed text-mp-ink-tertiary">
                {state.invoice.bolt11}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copy('invoice', state.invoice.bolt11)}
                  className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
                >
                  {copied === 'invoice' ? <Check size={10} aria-hidden="true" /> : <Copy size={10} aria-hidden="true" />}
                  {copied === 'invoice' ? 'Copied' : 'Copy invoice'}
                </button>
                <a
                  href={`lightning:${state.invoice.bolt11}`}
                  className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
                >
                  Open in wallet <ExternalLink size={10} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => void check(state.invoice)}
                  disabled={state.phase === 'checking'}
                  className="rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text disabled:opacity-50"
                >
                  {state.phase === 'checking' ? 'Checking…' : 'Check payment'}
                </button>
              </div>

              {state.phase === 'open' && (
                <p className="text-[10px] leading-relaxed text-mp-wax">
                  Your wallet reports this invoice as {state.status.state}. No receipt is issued for an unpaid
                  invoice.
                </p>
              )}

              {state.phase === 'settled' && (
                <div className="space-y-1.5">
                  <p className="text-[10px] leading-relaxed text-mp-proof">
                    Your wallet reports this invoice paid
                    {state.status.settledAt != null
                      ? ` at ${new Date(state.status.settledAt * 1000).toISOString().slice(0, 19).replace('T', ' ')} UTC`
                      : ''}
                    . MotoPass did not watch the payment.
                  </p>
                  <p className="font-mono text-[9px] break-all text-mp-ink-tertiary">
                    {receiptEvidenceLine(state.invoice.paymentHash, state.status.preimage)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void publish(state.invoice, state.status)}
                    disabled={busy}
                    className="rounded-full border border-mp-btc/40 px-2.5 py-1 font-chrome text-[10px] font-semibold text-mp-btc-text hover:bg-mp-btc/10 disabled:opacity-50"
                  >
                    {busy ? 'Signing…' : 'Publish signed receipt'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="mt-2 space-y-1.5 border-t border-mp-border-subtle pt-2">
          {receipt.status === 'published' && (
            <p className="text-[10px] text-mp-proof">
              Receipt published{receipt.relaySummary ? ` · ${receipt.relaySummary}` : ''}
            </p>
          )}
          {receipt.status === 'signed-unpublished' && (
            <p className="text-[10px] text-mp-wax">Signed but no relay accepted it. {receipt.error}</p>
          )}
          {receipt.status === 'unsigned' && (
            <p className="text-[10px] leading-relaxed text-mp-ink-tertiary">
              No NIP-07 signer in this browser. The receipt is built and valid — copy the JSON and publish it from a
              Nostr client.
            </p>
          )}
          {receipt.status === 'rejected' && <p className="text-[10px] text-mp-wax">{receipt.error}</p>}
          {receipt.status !== 'rejected' && (
            <button
              type="button"
              onClick={() => void copy('json', receipt.json)}
              className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
            >
              {copied === 'json' ? <Check size={10} aria-hidden="true" /> : <Copy size={10} aria-hidden="true" />}
              {copied === 'json' ? 'Copied' : 'Copy receipt JSON'}
            </button>
          )}
        </div>
      )}

      <div className="mt-2 border-t border-mp-border-subtle pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">
            Wallet activity
          </p>
          <button
            type="button"
            onClick={() => void loadActivity()}
            disabled={activity.phase === 'loading'}
            className="rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text disabled:opacity-50"
          >
            {activity.phase === 'loading' ? 'Reading wallet…' : activity.phase === 'ready' ? 'Refresh' : 'Show payments'}
          </button>
        </div>

        {activity.phase === 'error' && <p className="mt-1 text-[10px] text-mp-wax">{activity.error}</p>}

        {activity.phase === 'ready' && activity.transactions.length === 0 && (
          <p className="mt-1 text-[10px] text-mp-ink-tertiary">Your wallet reports no transactions.</p>
        )}

        {activity.phase === 'ready' && activity.transactions.length > 0 && (
          <ul className="mt-1 divide-y divide-mp-border-subtle/60">
            {activity.transactions.map((tx, index) => {
              const when = tx.settledAt ?? tx.createdAt
              const sats = tx.amountMsat != null ? Math.round(tx.amountMsat / 1000) : null
              const matchesReceipt = receiptHash != null && tx.paymentHash === receiptHash
              return (
                <li
                  key={`${tx.paymentHash ?? when ?? 'row'}-${index}`}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1"
                >
                  <span className="font-mono text-[10px] text-mp-ink-tertiary">
                    {when ? new Date(when * 1000).toISOString().slice(0, 16).replace('T', ' ') : 'no date'}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-[10px] text-mp-ink-secondary"
                    title={tx.description ?? undefined}
                  >
                    {tx.type === 'outgoing' ? 'sent' : 'received'}
                    {tx.description ? ` · ${tx.description}` : ''}
                  </span>
                  <span className="font-mono text-[10px] text-mp-ink">
                    {sats != null ? `${tx.type === 'outgoing' ? '−' : '+'}${formatSatsExact(sats)}` : 'amount not reported'}
                  </span>
                  <span
                    className={
                      tx.state === 'settled'
                        ? 'text-[10px] text-mp-proof'
                        : tx.state === 'pending'
                          ? 'text-[10px] text-mp-ink-tertiary'
                          : 'text-[10px] text-mp-wax'
                    }
                  >
                    {tx.state}
                  </span>
                  {matchesReceipt && <span className="text-[9px] text-mp-btc-text">this receipt</span>}
                </li>
              )
            })}
          </ul>
        )}

        <p className="mt-1 text-[9px] leading-relaxed text-mp-ink-tertiary">
          Your wallet&apos;s own list, read only when you ask. A row is a gap tip only when its payment hash matches a
          receipt; nothing here is summed, and payments unrelated to MotoPass can appear.
        </p>
      </div>

      <p className="mt-2 text-[9px] leading-relaxed text-mp-ink-tertiary">
        Signed by your npub, not by MotoPass and not by the receiving wallet. It records a payment; it does not fill
        the fact.
      </p>
    </div>
  )
}
