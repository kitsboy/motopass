import { Bitcoin } from 'lucide-react'
import { PAYMENT_RAILS, type PaymentRail, type UserPayment } from '../types/user'
import {
  createPaymentInvoice,
  hasLiveLightning,
  getLightningAddress,
  type PaymentInvoice,
} from '../lib/payments'
import { AnimatedBadge } from './beui/AnimatedBadge'
import { PaymentQrCode } from './ui/PaymentQrCode'
import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

export function PaymentMethods({
  onPay,
  payments,
}: {
  onPay: (rail: PaymentRail, amountSats: number, invoice: PaymentInvoice) => void
  payments: UserPayment[]
}) {
  const { t } = useI18n()
  const DEMO_AMOUNT = 50_000
  const [lastInvoice, setLastInvoice] = useState<PaymentInvoice | null>(null)
  const demoBtc = (DEMO_AMOUNT / 100_000_000).toFixed(4)
  const liveLn = hasLiveLightning()
  const lnAddress = getLightningAddress()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-mp-ink mb-4 flex items-center gap-2">
          <Bitcoin size={16} className="text-mp-btc" /> {t('payments.accept')}
        </h3>
        {liveLn && (
          <p className="text-xs text-mp-proof mb-3 font-mono">
            {t('payments.liveLightning')}: {lnAddress}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PAYMENT_RAILS.map(rail => (
            <button
              key={rail.id}
              type="button"
              onClick={() => {
                const inv = createPaymentInvoice(rail.id, DEMO_AMOUNT, 'MotoPass fee')
                setLastInvoice(inv)
                onPay(rail.id, DEMO_AMOUNT, inv)
              }}
              className="rounded-mp-lg border border-mp-border bg-card-muted p-4 text-left transition-all hover:border-mp-btc/40 hover:bg-mp-btc-soft/30"
            >
              <div className="text-sm font-semibold text-mp-ink">{rail.label}</div>
              <div className="text-[10px] text-mp-ink-tertiary mt-1">{rail.desc}</div>
              {rail.id === 'lightning' && liveLn && (
                <div className="mt-2 text-[10px] font-mono text-mp-proof">{t('payments.liveBadge')}</div>
              )}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-mp-ink-tertiary mt-3">
          {liveLn
            ? t('payments.liveNote').replace('{btc}', demoBtc)
            : t('payments.demoNote').replace('{btc}', demoBtc)}
        </p>
      </div>

      {lastInvoice && (
        <div className="rounded-mp-lg border border-mp-border bg-card-muted p-4 space-y-3">
          {lastInvoice.qrPayload && !lastInvoice.demo && (
            <PaymentQrCode
              value={lastInvoice.qrPayload}
              label={lastInvoice.rail}
              temp={lastInvoice.demo}
            />
          )}
          {lastInvoice.qrPayload && lastInvoice.demo && lastInvoice.rail === 'lightning' && (
            <PaymentQrCode value={lastInvoice.qrPayload} label={lastInvoice.rail} temp />
          )}
          <div className="text-xs font-mono space-y-1 text-mp-ink-secondary">
            <div>
              Invoice: {lastInvoice.id}
              {lastInvoice.demo ? ` · ${t('payments.demoBadge')}` : ` · ${t('payments.liveBadge')}`}
            </div>
            {lastInvoice.lightningAddress && <div>LN Address: {lastInvoice.lightningAddress}</div>}
            {lastInvoice.bolt11 && <div>BOLT11: {lastInvoice.bolt11}</div>}
            {lastInvoice.bolt12Offer && <div>BOLT12: {lastInvoice.bolt12Offer}</div>}
            {lastInvoice.liquidAddress && <div>Liquid: {lastInvoice.liquidAddress}</div>}
            {lastInvoice.onchainAddress && <div>BTC: {lastInvoice.onchainAddress}</div>}
            {lastInvoice.silentPaymentAddress && <div>Silent: {lastInvoice.silentPaymentAddress}</div>}
            {lastInvoice.pynymHandle && <div>PYNYM: {lastInvoice.pynymHandle}</div>}
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-mp-ink mb-3">{t('payments.history')}</h3>
          <ul className="space-y-2">
            {payments.map(p => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-mp-lg border border-mp-border bg-mp-card px-4 py-3 text-sm shadow-mp-1"
              >
                <div>
                  <div className="font-medium text-mp-ink">{p.label}</div>
                  <div className="text-[10px] text-mp-ink-tertiary font-mono">
                    {p.rail} · {p.amountSats.toLocaleString()} sats
                  </div>
                </div>
                <AnimatedBadge
                  status={
                    p.status === 'confirmed' ? 'success' : p.status === 'failed' ? 'danger' : 'loading'
                  }
                >
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
