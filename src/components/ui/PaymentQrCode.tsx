import { QRCodeSVG } from 'qrcode.react'
import { useI18n } from '../../i18n/I18nContext'

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
        <QRCodeSVG
          value={value}
          size={168}
          level="M"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#18181b"
          title={label}
        />
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