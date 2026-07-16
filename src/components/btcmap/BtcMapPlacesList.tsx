import { useRef, type RefObject } from 'react'
import { ExternalLink, Heart, MapPin, Navigation } from 'lucide-react'
import { btcMapMerchantUrl, googleMapsDirectionsUrl } from '../../lib/btcmap'
import { btcMapPlaceCategory } from '../../lib/btcmapIcons'
import type { BtcMapPlace } from '../../lib/btcmap'
import { highlightMatches } from '../../lib/btcmapHighlight'
import { useBtcMapAuth } from '../../context/BtcMapAuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { useVirtualScroll } from '../../hooks/useVirtualScroll'

const DIRECTORY_ROW_HEIGHT = 56
const VIRTUALIZE_THRESHOLD = 48

export function BtcMapPlacesList({
  places,
  loading,
  error,
  compact = false,
  showSave = false,
  variant = 'cards',
  highlightQuery = '',
  scrollContainerRef,
}: {
  places: BtcMapPlace[]
  loading: boolean
  error: string | null
  compact?: boolean
  showSave?: boolean
  variant?: 'cards' | 'directory'
  highlightQuery?: string
  scrollContainerRef?: RefObject<HTMLElement | null>
}) {
  const { t } = useI18n()
  const auth = useBtcMapAuth()
  const isDirectory = variant === 'directory'
  const fallbackScrollRef = useRef<HTMLElement | null>(null)
  const virtualScrollRef = scrollContainerRef ?? fallbackScrollRef
  const virtualize = isDirectory && !loading && !error && places.length > VIRTUALIZE_THRESHOLD
  const virtual = useVirtualScroll(virtualScrollRef, {
    itemCount: places.length,
    itemHeight: DIRECTORY_ROW_HEIGHT,
    enabled: virtualize,
  })
  const visiblePlaces = virtualize
    ? places.slice(virtual.startIndex, virtual.endIndex)
    : places

  if (loading) {
    return <p className={`text-sm text-ink-muted animate-pulse ${isDirectory ? 'px-3 py-6' : ''}`}>{t('btcmap.loading')}</p>
  }

  if (error === 'no_coords') {
    return <p className={`text-sm text-ink-muted ${isDirectory ? 'px-3 py-6' : ''}`}>{t('btcmap.noCoords')}</p>
  }

  if (error) {
    return <p className={`text-sm text-status-amber ${isDirectory ? 'px-3 py-6' : ''}`}>{t('btcmap.error')}</p>
  }

  if (!places.length) {
    return <p className={`text-sm text-ink-muted ${isDirectory ? 'px-3 py-6' : ''}`}>{t('btcmap.empty')}</p>
  }

  const renderDirectoryRow = (p: BtcMapPlace) => {
    const category = btcMapPlaceCategory(p)
    const CategoryIcon = category.icon

    return (
      <li key={p.id} className="group" style={virtualize ? { height: DIRECTORY_ROW_HEIGHT } : undefined}>
        <div className="flex items-start gap-1 px-2 py-2.5 rounded-mp-md transition-colors hover:bg-section/60 h-full">
          {showSave && (
            <button
              type="button"
              onClick={() => void auth.toggleSave(p.id)}
              disabled={auth.signingIn}
              aria-label={auth.isSaved(p.id) ? t('btcmap.unsave') : t('btcmap.save')}
              className={`shrink-0 mt-0.5 p-1 rounded-lg transition-colors ${
                auth.isSaved(p.id)
                  ? 'text-btc-orange'
                  : 'text-ink-muted/50 opacity-0 group-hover:opacity-100 hover:text-btc-orange'
              }`}
            >
              <Heart size={12} className={auth.isSaved(p.id) ? 'fill-current' : ''} />
            </button>
          )}
          <span
            className="shrink-0 mt-1 p-1 rounded-lg border border-mp/50 bg-card-muted/40 text-ink-muted"
            title={category.label}
            aria-hidden
          >
            <CategoryIcon size={11} />
          </span>
          <a
            href={btcMapMerchantUrl(p.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 flex items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="font-chrome text-sm font-medium text-ink truncate group-hover:text-mp-btc-text transition-colors">
                {highlightMatches(p.name ?? t('btcmap.unnamed'), highlightQuery)}
              </div>
              {p.address && (
                <div className="text-[11px] text-ink-muted truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="shrink-0 opacity-60" aria-hidden />
                  {highlightMatches(p.address, highlightQuery)}
                </div>
              )}
              {p.verified_at && (
                <span className="inline-block mt-1 text-[10px] font-mono text-mp-proof/90">
                  {t('btcmap.verified')} {p.verified_at.slice(0, 10)}
                </span>
              )}
            </div>
            <ExternalLink
              size={12}
              className="shrink-0 mt-1 text-ink-muted/40 group-hover:text-mp-btc-text transition-colors"
              aria-hidden
            />
          </a>
          <a
            href={googleMapsDirectionsUrl(p.lat, p.lon, p.address ?? p.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 mt-0.5 p-1 rounded-lg text-ink-muted/50 opacity-0 group-hover:opacity-100 hover:text-mp-btc-text transition-colors"
            aria-label={t('btcmap.directions')}
            title={t('btcmap.directions')}
          >
            <Navigation size={12} aria-hidden />
          </a>
        </div>
      </li>
    )
  }

  if (isDirectory) {
    if (virtualize) {
      return (
        <ul
          className="relative divide-y divide-mp/40"
          style={{ height: virtual.totalHeight }}
          aria-rowcount={places.length}
        >
          <div
            className="absolute inset-x-0 top-0 divide-y divide-mp/40"
            style={{ transform: `translateY(${virtual.offsetY}px)` }}
          >
            {visiblePlaces.map(renderDirectoryRow)}
          </div>
        </ul>
      )
    }

    return (
      <ul className="divide-y divide-mp/40">
        {visiblePlaces.map(renderDirectoryRow)}
      </ul>
    )
  }

  return (
    <ul className={compact ? 'space-y-2' : 'space-y-2.5'}>
      {places.map(p => (
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
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm text-ink group-hover:text-accent truncate">
                {p.name ?? t('btcmap.unnamed')}
              </div>
              {p.address && (
                <div className="text-[11px] text-ink-muted truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="shrink-0" aria-hidden /> {p.address}
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