import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useBtcMapDensity } from '../../context/BtcMapDensityContext'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import type { DensityTier } from '../../lib/btcmapDensity'
import { serializeIdList } from '../../lib/urlState'

const TIER_CLASS: Record<DensityTier, string> = {
  sparse: 'border-mp-border text-mp-ink-tertiary bg-mp-section',
  moderate: 'border-btc-orange/30 text-btc-orange bg-btc-orange-soft/40',
  dense: 'border-mp-btc/40 text-mp-btc-text bg-mp-btc-soft',
}

export function MerchantDensityBadge({
  programName,
  programId,
}: {
  programName: string
  programId?: number
}) {
  const { t } = useI18n()
  const { density, loading } = useBtcMapDensity(programName)

  if (loading || !density) return null

  const className = `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] ${TIER_CLASS[density.tier]}`
  const title = formatT(t, 'btcmap.densityTooltip', { count: density.count, score: density.score })
  const label = (
    <>
      <MapPin size={10} aria-hidden="true" />
      {formatT(t, 'btcmap.densityBadge', { count: density.count })}
    </>
  )

  if (programId != null) {
    return (
      <Link
        to={`/btcmap?program=${serializeIdList([programId])}`}
        className={`${className} hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mp-btc`}
        title={title}
        aria-label={formatT(t, 'programs.viewBtcMap', { name: programName })}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </Link>
    )
  }

  return (
    <span className={className} title={title}>
      {label}
    </span>
  )
}