import { Bitcoin } from 'lucide-react'
import { PAYMENT_RAILS, type PaymentRail, type UserPayment } from '../types/user'
import { createInvoicePlaceholder, type PaymentInvoice } from '../lib/payments'
import { AnimatedBadge } from './beui/AnimatedBadge'
import { useState } from 'react'

export function PaymentMethods({
  onPay,
  payments,
}: {
  onPay: (rail: PaymentRail, amountSats: number, invoice: PaymentInvoice) => void
  payments: UserPayment[]
}) {
  const DEMO_AMOUNT = 50_000
  const [lastInvoice, setLastInvoice] = useState<PaymentInvoice | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-mp-ink mb-4 flex items-center gap-2">
          <Bitcoin size={16} className="text-mp-btc" /> Accept payment
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PAYMENT_RAILS.map(rail => (
            <button
              key={rail.id}
              type="button"
              onClick={() => {
                const inv = createInvoicePlaceholder(rail.id, DEMO_AMOUNT, 'MotoPass fee')
                setLastInvoice(inv)
                onPay(rail.id, DEMO_AMOUNT, inv)
              }}
              className="rounded-mp-lg border border-mp-border bg-card-muted p-4 text-left transition-all hover:border-mp-btc/40 hover:bg-mp-btc-soft/30"
            >
              <div className="text-sm font-semibold text-mp-ink">{rail.label}</div>
              <div className="text-[10px] text-mp-ink-tertiary mt-1">{rail.desc}</div>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-mp-ink-tertiary mt-3">
          Demo: {(DEMO_AMOUNT / 100_000_000).toFixed(4)} BTC equivalent · BOLT12 offers & Silent Payments supported
        </p>
      </div>

      {lastInvoice && (
        <div className="rounded-mp-lg border border-mp-border bg-card-muted p-4 text-xs font-mono space-y-1 text-mp-ink-secondary">
          <div>Invoice: {lastInvoice.id}</div>
          {lastInvoice.bolt11 && <div>BOLT11: {lastInvoice.bolt11}</div>}
          {lastInvoice.bolt12Offer && <div>BOLT12: {lastInvoice.bolt12Offer}</div>}
          {lastInvoice.liquidAddress && <div>Liquid: {lastInvoice.liquidAddress}</div>}
          {lastInvoice.onchainAddress && <div>BTC: {lastInvoice.onchainAddress}</div>}
          {lastInvoice.silentPaymentAddress && <div>Silent: {lastInvoice.silentPaymentAddress}</div>}
          {lastInvoice.pynymHandle && <div>PYNYM: {lastInvoice.pynymHandle}</div>}
        </div>
      )}

      {payments.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-mp-ink mb-3">Payment history</h3>
          <ul className="space-y-2">
            {payments.map(p => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-mp-lg border border-mp-border bg-mp-card px-4 py-3 text-sm shadow-mp-1">
                <div>
                  <div className="font-medium text-mp-ink">{p.label}</div>
                  <div className="text-[10px] text-mp-ink-tertiary font-mono">{p.rail} · {p.amountSats.toLocaleString()} sats</div>
                </div>
                <AnimatedBadge status={p.status === 'confirmed' ? 'success' : p.status === 'failed' ? 'danger' : 'loading'}>
                  {p.status}
                </AnimatedBadge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}