import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { BtcMapPlace } from '../../lib/btcmap'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { BtcMapPlacesList } from './BtcMapPlacesList'

export function BtcMapMerchantDirectory({
  places,
  loading,
  error,
  showSave = true,
}: {
  places: BtcMapPlace[]
  loading: boolean
  error: string | null
  showSave?: boolean
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 120)

  const filtered = useMemo(() => {
    if (!debounced) return places
    return places.filter(p => {
      const hay = [p.name, p.address].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(debounced)
    })
  }, [places, debounced])

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-mp/50 space-y-3">
        <div>
          <h2 className="font-display font-semibold text-sm text-ink tracking-tight">
            {t('btcmap.directoryTitle')}
          </h2>
          <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{t('btcmap.directorySub')}</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('btcmap.searchMerchants')}
            className="input-field w-full !py-2 !pl-9 !pr-3 text-xs font-chrome"
            aria-label={t('btcmap.searchMerchants')}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          <span>
            {loading
              ? t('btcmap.loading')
              : formatT(t, 'btcmap.merchantCount', { count: filtered.length })}
          </span>
          {debounced && places.length !== filtered.length && (
            <span className="text-ink-muted/80 normal-case tracking-normal font-body">
              {filtered.length} of {places.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2 btcmap-directory-scroll">
        <BtcMapPlacesList
          places={filtered}
          loading={loading}
          error={error}
          showSave={showSave}
          variant="directory"
        />
      </div>
    </div>
  )
}