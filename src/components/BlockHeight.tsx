import { useEffect, useState } from 'react'
import { Bitcoin } from 'lucide-react'
import { fetchBitcoinBlockHeight } from '../lib/satohash'
import { useI18n } from '../i18n/I18nContext'

export function BlockHeight() {
  const { t } = useI18n()
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    fetchBitcoinBlockHeight().then(setHeight)
    const id = setInterval(() => fetchBitcoinBlockHeight().then(setHeight), 120_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-btc-orange/90">
      <Bitcoin size={12} />
      <span>{t('block.live')}</span>
      <span className="text-white font-semibold">{height ? `#${height.toLocaleString()}` : '…'}</span>
    </div>
  )
}