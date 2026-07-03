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
    <div className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-card border border-mp rounded-full px-3 py-1.5 text-ink-secondary">
      <Bitcoin size={12} className="text-btc-orange" />
      <span>{t('block.live')}</span>
      <span className="text-ink font-semibold">{height ? `#${height.toLocaleString()}` : '…'}</span>
    </div>
  )
}