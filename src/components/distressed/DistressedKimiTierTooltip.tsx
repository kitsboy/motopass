import { useId, useState } from 'react'
import { Info } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

type Tier = 'gold' | 'standard'

export function DistressedKimiTierTooltip({ tier }: { tier: Tier }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const tooltipId = useId()

  const labelKey = tier === 'gold' ? 'distressed.kimiGold' : 'distressed.kimiCurated'
  const tooltipKey = tier === 'gold' ? 'distressed.kimiGoldTooltip' : 'distressed.kimiCuratedTooltip'

  return (
    <span className="relative inline-flex items-center gap-0.5 shrink-0">
      <span
        className={`text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-chip border inline-flex items-center gap-1 ${
          tier === 'gold'
            ? 'border-btc-orange/45 text-mp-btc-text bg-btc-orange-soft/50'
            : 'border-mp-proof/40 text-mp-proof bg-mp-proof/10'
        }`}
      >
        {t(labelKey)}
      </span>
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-ink-muted hover:text-mp-btc-text hover:bg-section/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-btc-orange/50"
        aria-label={t(tooltipKey)}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={e => {
          e.stopPropagation()
          setOpen(v => !v)
        }}
      >
        <Info size={10} aria-hidden />
      </button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-52 rounded-mp-md border border-mp/60 bg-card p-2.5 text-left shadow-mp-2"
          onClick={e => e.stopPropagation()}
        >
          <span className="font-body text-[10px] text-ink-secondary leading-relaxed">{t(tooltipKey)}</span>
        </span>
      )}
    </span>
  )
}