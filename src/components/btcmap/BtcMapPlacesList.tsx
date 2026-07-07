import { ExternalLink, Heart, MapPin, Store } from 'lucide-react'
import { btcMapMerchantUrl } from '../../lib/btcmap'
import type { BtcMapPlace } from '../../lib/btcmap'
import { useBtcMapAuth } from '../../context/BtcMapAuthContext'
import { useI18n } from '../../i18n/I18nContext'

export function BtcMapPlacesList({
  places,
  loading,
  error,
  compact = false,
  showSave = false,
}: {
  places: BtcMapPlace[]
  loading: boolean
  error: string | null
  compact?: boolean
  showSave?: boolean
}) {
  const { t } = useI18n()
  const auth = useBtcMapAuth()

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
        <li key={p.id} className="flex items-start gap-1">
          {showSave && (
            <button
              type="button"
              onClick={() => void auth.toggleSave(p.id)}
              disabled={auth.signingIn}
              aria-label={auth.isSaved(p.id) ? t('btcmap.unsave') : t('btcmap.save')}
              className={`shrink-0 mt-2.5 p-1.5 rounded-mp-md border transition-colors ${
                auth.isSaved(p.id)
                  ? 'border-btc-orange/50 bg-btc-orange-soft text-btc-orange'
                  : 'border-mp-border text-ink-muted hover:border-btc-orange/35 hover:text-btc-orange'
              }`}
            >
              <Heart size={12} className={auth.isSaved(p.id) ? 'fill-current' : ''} />
            </button>
          )}
          <a
            href={btcMapMerchantUrl(p.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 rounded-mp-md border border-mp-border bg-mp-card-muted/50 px-3 py-2.5 hover:border-btc-orange/35 hover:bg-btc-orange-soft/30 transition-colors group flex-1 min-w-0"
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