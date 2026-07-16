import { AlertTriangle } from 'lucide-react'
import { formatCacheAge, isCacheStale } from '../../lib/btcmapFreshness'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

/** Warning banner when offline BTC Map cache is older than 7 days (item 827). */
export function BtcMapCacheStaleBanner({ fetchedAt }: { fetchedAt: string }) {
  const { t } = useI18n()
  if (!isCacheStale(fetchedAt)) return null

  const age = formatCacheAge(fetchedAt)

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-card border border-status-amber/45 bg-status-amber/10 px-4 py-3 text-sm text-ink-secondary"
    >
      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-status-amber" aria-hidden />
      <p className="leading-relaxed">
        {formatT(t, 'btcmap.cacheStaleBanner', { age })}
      </p>
    </div>
  )
}