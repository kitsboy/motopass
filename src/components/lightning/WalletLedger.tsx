import { useState } from 'react'
import { nwcListTransactions, type NwcTransaction } from '../../lib/nwc'
import { formatSatsExact } from '../../lib/satsAnchor'

/**
 * The wallet's own payments, read on request.
 *
 * This is not a MotoPass ledger. The list is whatever the wallet reports, it
 * can include payments unrelated to any gap tip, and it is never summed here.
 * A row is marked `your receipt` only when its payment hash matches a receipt
 * saved on this device, which is the one claim this panel can check offline.
 */

type Filter = 'all' | 'incoming' | 'outgoing' | 'receipts'

type Activity =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; error: string }
  | { phase: 'ready'; transactions: NwcTransaction[] }

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'incoming', label: 'Received' },
  { key: 'outgoing', label: 'Sent' },
  { key: 'receipts', label: 'My receipts' },
]

export function WalletLedger({
  nwcUri,
  highlightHashes = [],
  limit = 10,
}: {
  nwcUri: string
  highlightHashes?: string[]
  limit?: number
}) {
  const [activity, setActivity] = useState<Activity>({ phase: 'idle' })
  const [filter, setFilter] = useState<Filter>('all')

  const load = async () => {
    setActivity({ phase: 'loading' })
    const listed = await nwcListTransactions(nwcUri, { limit })
    setActivity(listed.ok ? { phase: 'ready', transactions: listed.transactions } : { phase: 'error', error: listed.error })
  }

  const receiptHashes = new Set(highlightHashes.map(hash => hash.toLowerCase()))
  const transactions = activity.phase === 'ready' ? activity.transactions : []
  const matchesReceipt = (tx: NwcTransaction) => tx.paymentHash != null && receiptHashes.has(tx.paymentHash)

  const counts: Record<Filter, number> = {
    all: transactions.length,
    incoming: transactions.filter(tx => tx.type === 'incoming').length,
    outgoing: transactions.filter(tx => tx.type === 'outgoing').length,
    receipts: transactions.filter(matchesReceipt).length,
  }
  const visible = transactions.filter(tx => {
    if (filter === 'receipts') return matchesReceipt(tx)
    if (filter === 'all') return true
    return tx.type === filter
  })
  const chips = FILTERS.filter(option => option.key !== 'receipts' || counts.receipts > 0)

  return (
    <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">
          Wallet activity
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={activity.phase === 'loading'}
          className="rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text disabled:opacity-50"
        >
          {activity.phase === 'loading' ? 'Reading wallet…' : activity.phase === 'ready' ? 'Refresh' : 'Show payments'}
        </button>
      </div>

      {activity.phase === 'error' && <p className="mt-1 text-[10px] text-mp-wax">{activity.error}</p>}

      {activity.phase === 'ready' && transactions.length === 0 && (
        <p className="mt-1 text-[10px] text-mp-ink-tertiary">Your wallet reports no transactions.</p>
      )}

      {activity.phase === 'ready' && transactions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1" role="group" aria-label="Filter wallet activity">
          {chips.map(option => {
            const active = filter === option.key
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.key)}
                className={
                  active
                    ? 'rounded-full border border-mp-btc/50 bg-mp-btc/10 px-2 py-0.5 font-chrome text-[10px] font-semibold text-mp-btc-text'
                    : 'rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text'
                }
              >
                {option.label} {counts[option.key]}
              </button>
            )
          })}
          {filter !== 'all' && (
            <span className="ml-auto font-chrome text-[9px] text-mp-ink-tertiary">
              showing {visible.length} of {transactions.length}
            </span>
          )}
        </div>
      )}

      {activity.phase === 'ready' && transactions.length > 0 && visible.length === 0 && (
        <p className="mt-1.5 text-[10px] text-mp-ink-tertiary">
          {filter === 'receipts'
            ? 'No wallet payment matches a receipt saved on this device.'
            : `Your wallet reports no ${filter === 'incoming' ? 'received' : 'sent'} payments in this list.`}
        </p>
      )}

      {visible.length > 0 && (
        <ul className="mt-1 divide-y divide-mp-border-subtle/60">
          {visible.map((tx, index) => {
            const when = tx.settledAt ?? tx.createdAt
            const sats = tx.amountMsat != null ? Math.round(tx.amountMsat / 1000) : null
            const matched = matchesReceipt(tx)
            return (
              <li
                key={`${tx.paymentHash ?? when ?? 'row'}-${index}`}
                className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1 ${matched ? 'bg-mp-btc/5' : ''}`}
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
                  {sats != null
                    ? `${tx.type === 'outgoing' ? '−' : '+'}${formatSatsExact(sats)}`
                    : 'amount not reported'}
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
                {matched && <span className="text-[9px] font-semibold text-mp-btc-text">your receipt</span>}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-1 text-[9px] leading-relaxed text-mp-ink-tertiary">
        Your wallet&apos;s own list, read only when you ask and never summed. A row marked{' '}
        <span className="text-mp-btc-text">your receipt</span> matches a signed receipt saved on this device; payments
        unrelated to MotoPass can appear.
      </p>
    </div>
  )
}
