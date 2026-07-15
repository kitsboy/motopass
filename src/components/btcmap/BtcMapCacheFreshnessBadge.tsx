import { Database } from 'lucide-react'
import { cacheFreshnessLevel, formatCacheAge } from '../../lib/btcmapFreshness'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

const LEVEL_STYLES = {
  fresh: 'border-mp-proof/30 bg-mp-proof-soft text-mp-proof',
  recent: 'border-mp-ochre/40 bg-mp-btc-soft text-mp-btc-text',
  expired: 'border-status-red/45 bg-status-red/12 text-status-red',
} as const

export function BtcMapCacheFreshnessBadge({ fetchedAt }: { fetchedAt: string }) {
  const { t } = useI18n()
  const level = cacheFreshnessLevel(fetchedAt)
  const age = formatCacheAge(fetchedAt)

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-chip border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${LEVEL_STYLES[level]}`}
      role="status"
      title={formatT(t, 'btcmap.cacheFreshnessTitle', { fetchedAt })}
    >
      <Database size={10} className="shrink-0" aria-hidden />
      {formatT(t, 'btcmap.cacheFreshness', { age })}
    </span>
  )
}