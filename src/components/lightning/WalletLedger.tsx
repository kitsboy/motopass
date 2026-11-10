import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { nwcListTransactions, type NwcTransaction } from '../../lib/nwc'
import { formatSatsExact } from '../../lib/satsAnchor'
import { checkPreimage, type PreimageCheck } from '../../lib/preimage'

/**
 * The wallet's own payments, read on request.
 *
 * This is not a MotoPass ledger. The list is whatever the wallet reports, it
 * can include payments unrelated to any gap tip, and it is never summed here.
 * A row is marked `your receipt` only when its payment hash matches a receipt
 * saved on this device, which is the one claim this panel can check offline.
 * Opening a row adds the wallet-reported fee and a local sha256 check of the
 * preimage; neither is a MotoPass total.
 */

type Filter = 'all' | 'incoming' | 'outgoing' | 'receipts'
type Range = 'all' | '24h' | '7d' | '30d'

type Activity =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; error: string }
  | { phase: 'ready'; transactions: NwcTransaction[]; unpaid: boolean }

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'incoming', label: 'Received' },
  { key: 'outgoing', label: 'Sent' },
  { key: 'receipts', label: 'My receipts' },
]

const RANGES: { key: Range; label: string; seconds: number | null }[] = [
  { key: 'all', label: 'All time', seconds: null },
  { key: '24h', label: '24h', seconds: 86_400 },
  { key: '7d', label: '7 days', seconds: 7 * 86_400 },
  { key: '30d', label: '30 days', seconds: 30 * 86_400 },
]

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

function PreimageEvidence({ tx }: { tx: NwcTransaction }) {
  const [result, setResult] = useState<PreimageCheck | null>(null)

  useEffect(() => {
    if (!tx.preimage || !tx.paymentHash) return
    let live = true
    void checkPreimage(tx.preimage, tx.paymentHash).then(check => {
      if (live) setResult(check)
    })
    return () => {
      live = false
    }
  }, [tx.preimage, tx.paymentHash])

  if (!tx.preimage) {
    return <span className="text-mp-ink-tertiary">The wallet did not report a preimage.</span>
  }
  if (result == null) return <span className="text-mp-ink-tertiary">Checking sha256 locally…</span>
  if (result === 'match') {
    return <span className="text-mp-proof">sha256 of this preimage matches the payment hash.</span>
  }
  if (result === 'mismatch') {
    return <span className="text-mp-wax">This preimage does not hash to the payment hash.</span>
  }
  return <span className="text-mp-ink-tertiary">The preimage could not be checked in this browser.</span>
}

function TxDetail({ tx }: { tx: NwcTransaction }) {
  const feeSats = tx.feesPaidMsat != null ? Math.round(tx.feesPaidMsat / 1000) : null
  return (
    <div className="space-y-1 pb-1.5 pl-4 text-[10px] leading-relaxed">
      <p className="text-mp-ink-tertiary">
        Wallet-reported fee:{' '}
        <span className="font-mono text-mp-ink-secondary">
          {feeSats != null ? formatSatsExact(feeSats) : 'not reported'}
        </span>
        {tx.type === 'incoming' ? ' — fees are only meaningful on outgoing payments.' : ''}
      </p>
      <p>
        <PreimageEvidence tx={tx} />
      </p>
      {tx.paymentHash && (
        <p className="break-all font-mono text-[9px] text-mp-ink-tertiary">payment hash {tx.paymentHash}</p>
      )}
      <a
        href="https://mempool.space/lightning"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-mp-btc-text hover:underline"
      >
        Look it up on mempool.space <ExternalLink size={9} aria-hidden="true" />
      </a>
    </div>
  )
}

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
  const [range, setRange] = useState<Range>('all')
  const [unpaid, setUnpaid] = useState(false)
  const [openKey, setOpenKey] = useState<string | null>(null)

  const load = async (next: { range?: Range; unpaid?: boolean } = {}) => {
    const nextRange = next.range ?? range
    const nextUnpaid = next.unpaid ?? unpaid
    setActivity({ phase: 'loading' })
    setOpenKey(null)
    const seconds = RANGES.find(option => option.key === nextRange)?.seconds ?? null
    const until = nowSeconds()
    const listed = await nwcListTransactions(nwcUri, {
      limit,
      unpaid: nextUnpaid,
      ...(seconds != null ? { from: until - seconds, until } : {}),
    })
    setActivity(
      listed.ok
        ? { phase: 'ready', transactions: listed.transactions, unpaid: nextUnpaid }
        : { phase: 'error', error: listed.error },
    )
  }

  const chooseRange = (next: Range) => {
    setRange(next)
    if (activity.phase === 'ready' || activity.phase === 'error') void load({ range: next })
  }

  const toggleUnpaid = () => {
    const next = !unpaid
    setUnpaid(next)
    if (activity.phase === 'ready' || activity.phase === 'error') void load({ unpaid: next })
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
  const showingUnpaid = activity.phase === 'ready' && activity.unpaid

  return (
    <div className="rounded-mp-md border border-mp-border-subtle bg-mp-card/40 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-chrome text-[10px] font-semibold uppercase tracking-wide text-mp-ink-tertiary">
          Wallet activity
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-pressed={unpaid}
            onClick={toggleUnpaid}
            className={
              unpaid
                ? 'rounded-full border border-mp-btc/50 bg-mp-btc/10 px-2 py-0.5 font-chrome text-[10px] font-semibold text-mp-btc-text'
                : 'rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text'
            }
          >
            Unpaid only
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={activity.phase === 'loading'}
            className="rounded-full border border-mp-border px-2 py-0.5 font-chrome text-[10px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text disabled:opacity-50"
          >
            {activity.phase === 'loading'
              ? 'Reading wallet…'
              : activity.phase === 'ready'
                ? 'Refresh'
                : unpaid
                  ? 'Show unpaid'
                  : 'Show payments'}
          </button>
        </div>
      </div>

      {activity.phase === 'error' && <p className="mt-1 text-[10px] text-mp-wax">{activity.error}</p>}

      {activity.phase === 'ready' && transactions.length === 0 && (
        <p className="mt-1 text-[10px] text-mp-ink-tertiary">
          {showingUnpaid
            ? 'Your wallet reports no unpaid invoices.'
            : 'Your wallet reports no transactions in this range.'}
        </p>
      )}

      {activity.phase === 'ready' && transactions.length > 0 && (
        <div className="mt-1.5 space-y-1">
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter wallet activity">
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
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Wallet activity date range">
            {RANGES.map(option => {
              const active = range === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseRange(option.key)}
                  className={
                    active
                      ? 'rounded-full border border-mp-border bg-mp-card px-1.5 py-0.5 font-chrome text-[9px] font-semibold text-mp-ink'
                      : 'rounded-full border border-mp-border-subtle px-1.5 py-0.5 font-chrome text-[9px] text-mp-ink-tertiary hover:text-mp-ink-secondary'
                  }
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showingUnpaid && (
        <p className="mt-1 text-[9px] leading-relaxed text-mp-ink-tertiary">
          These are the wallet&apos;s unpaid invoices as it reports them. No receipt can exist for one until the wallet
          says it was paid.
        </p>
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
            const key = `${tx.paymentHash ?? when ?? 'row'}-${index}`
            const open = openKey === key
            return (
              <li key={key} className={matched ? 'bg-mp-btc/5' : ''}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenKey(open ? null : key)}
                  className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1 text-left"
                >
                  {open ? (
                    <ChevronDown size={10} className="text-mp-ink-tertiary" aria-hidden="true" />
                  ) : (
                    <ChevronRight size={10} className="text-mp-ink-tertiary" aria-hidden="true" />
                  )}
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
                </button>
                {open && <TxDetail tx={tx} />}
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
