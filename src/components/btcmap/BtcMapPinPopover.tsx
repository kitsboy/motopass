import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

type BtcMapPinPopoverProps = {
  name: string
  address?: string
  merchantUrl: string
}

/** Map pin popup with copy-address action (item 726). */
export function BtcMapPinPopover({ name, address, merchantUrl }: BtcMapPinPopoverProps) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="text-sm min-w-[10rem] max-w-[14rem]">
      <div className="font-medium text-gray-900">{name}</div>
      {address && (
        <div className="mt-1 flex items-start gap-1.5">
          <div className="text-xs text-gray-600 flex-1 leading-snug">{address}</div>
          <button
            type="button"
            onClick={() => void copyAddress()}
            className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-orange-600 transition-colors"
            aria-label={t('btcmap.copyAddress')}
            title={t('btcmap.copyAddress')}
          >
            {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
          </button>
        </div>
      )}
      <a
        href={merchantUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-orange-600 hover:underline mt-2 inline-block"
      >
        btcmap.org →
      </a>
    </div>
  )
}