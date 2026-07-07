import { Bitcoin } from 'lucide-react'
import { useBlockHeight } from '../context/BlockHeightContext'
import { useI18n } from '../i18n/I18nContext'

export function BlockHeight({ variant = 'default' }: { variant?: 'default' | 'hero' }) {
  const { t } = useI18n()
  const { height } = useBlockHeight()
  const isHero = variant === 'hero'

  return (
    <div
      className={
        isHero
          ? 'inline-flex items-center gap-1.5 text-[10px] font-mono rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-mp-on-hero-secondary backdrop-blur-sm'
          : 'nav-btn !font-mono !text-[10px] !gap-1 !px-2 !py-0 text-ink-secondary'
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