import { lazy, Suspense } from 'react'
import { useI18n } from '../../i18n/I18nContext'

// Lazy-load the QR renderer so qrcode.react (~43KB source) leaves the
// critical-path index chunk — it's only needed when a payment QR is actually
// shown (server-costs / payment / apply modals), never on first paint.
const QRCodeSVG = lazy(() =>
  import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })),
)

type Props = {
  value: string
  label: string
  temp?: boolean
}

export function PaymentQrCode({ value, label, temp }: Props) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center">
      <div className="p-3 sm:p-4 rounded-mp-xl bg-white border-2 border-mp shadow-card inline-block">
        <Suspense fallback={<div className="h-[168px] w-[168px]" aria-hidden />}>
          <QRCodeSVG
            value={value}
            size={168}
            level="M"
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#18181b"
            title={label}
          />
        </Suspense>
      </div>
      <p className="text-[10px] font-mono text-ink-muted mt-3 text-center uppercase tracking-wider">
        {t('payment.scanToPay')} · {label}
      </p>
      {temp && (
        <span className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          {t('payment.tempPlaceholder')}
        </span>
      )}
    </div>
  )
}