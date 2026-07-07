import { ExternalLink, MapPin, Store } from 'lucide-react'
import { btcMapMerchantUrl } from '../../lib/btcmap'
import type { BtcMapPlace } from '../../lib/btcmap'
import { useI18n } from '../../i18n/I18nContext'

export function BtcMapPlacesList({
  places,
  loading,
  error,
  compact = false,
}: {
  places: BtcMapPlace[]
  loading: boolean
  error: string | null
  compact?: boolean
}) {
  const { t } = useI18n()

  if (loading) {
    return <p className="text-sm text-ink-muted animate-pulse">{t('btcmap.loading')}</p>
  }

  if (error === 'no_coords') {
    return <p className="text-sm text-ink-muted">{t('btcmap.noCoords')}</p>
  }

  if (error) {
    return <p className="text-sm text-status-amber">{t('btcmap.error')}</p>
  }

  if (!places.length) {
    return <p className="text-sm text-ink-muted">{t('btcmap.empty')}</p>
  }

  return (
    <ul className={compact ? 'space-y-2' : 'space-y-2.5'}>
      {places.map((p) => (
        <li key={p.id}>
          <a
            href={btcMapMerchantUrl(p.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 rounded-mp-md border border-mp-border bg-mp-card-muted/50 px-3 py-2.5 hover:border-btc-orange/35 hover:bg-btc-orange-soft/30 transition-colors group"
          >
            <Store size={14} className="text-btc-orange shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm text-ink group-hover:text-accent truncate">
                {p.name ?? t('btcmap.unnamed')}
              </div>
              {p.address && (
                <div className="text-[11px] text-ink-muted truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="shrink-0" /> {p.address}
                </div>
              )}
              {p.verified_at && (
                <div className="text-[10px] font-mono text-mp-proof mt-1">
                  {t('btcmap.verified')} {p.verified_at.slice(0, 10)}
                </div>
              )}
            </div>
            <ExternalLink size={12} className="text-ink-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </li>
      ))}
    </ul>
  )
}