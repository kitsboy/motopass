import { useEffect, useState } from 'react'
import { Bitcoin } from 'lucide-react'
import { fetchBitcoinBlockHeight } from '../lib/satohash'
import { useI18n } from '../i18n/I18nContext'

export function BlockHeight({ variant = 'default' }: { variant?: 'default' | 'hero' }) {
  const { t } = useI18n()
  const [height, setHeight] = useState<number | null>(null)
  const isHero = variant === 'hero'

  useEffect(() => {
    fetchBitcoinBlockHeight().then(setHeight)
    const id = setInterval(() => fetchBitcoinBlockHeight().then(setHeight), 120_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className={
        isHero
          ? 'inline-flex items-center gap-1.5 text-[10px] font-mono rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-mp-on-hero-secondary backdrop-blur-sm'
          : 'inline-flex items-center gap-1.5 text-[10px] font-mono bg-card border border-mp rounded-full px-3 py-1.5 text-ink-secondary'
      }
    >
      <Bitcoin size={12} className="text-btc-orange" />
      <span>{t('block.live')}</span>
      <span
        className={isHero ? 'font-semibold text-mp-on-hero' : 'text-ink font-semibold'}
        aria-live="polite"
        aria-atomic="true"
      >
        {height ? `#${height.toLocaleString()}` : '…'}
      </span>
    </div>
  )
}