import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import type { DistressedFilters, DistressedLane, DistressedListing } from '../../types/distressedListing'
import { DistressedListingsList } from './DistressedListingsList'

const MAX_ASK_OPTIONS = [
  { value: 0, key: 'distressed.maxAskAny' as const },
  { value: 50_000, label: '$50k' },
  { value: 100_000, label: '$100k' },
  { value: 250_000, label: '$250k' },
  { value: 500_000, label: '$500k' },
] as const

const LANES: DistressedLane[] = ['all', 'curated', 'permissionless']

export function DistressedFilterDirectory({
  listings,
  totalCount,
  regions,
  lane,
  onLaneChange,
  filters,
  onFiltersChange,
  loading,
  error,
  onSelectListing,
}: {
  listings: DistressedListing[]
  totalCount: number
  regions: string[]
  lane: DistressedLane
  onLaneChange: (lane: DistressedLane) => void
  filters: DistressedFilters
  onFiltersChange: (filters: DistressedFilters) => void
  loading: boolean
  error: string | null
  onSelectListing: (listing: DistressedListing) => void
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 120)

  const filtered = useMemo(() => {
    if (!debounced) return listings
    return listings.filter(l => {
      const hay = [l.program_name, l.pathway_label, l.region, l.summary]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(debounced)
    })
  }, [listings, debounced])

  const laneLabel = (l: DistressedLane) => {
    if (l === 'all') return t('distressed.laneAll')
    if (l === 'curated') return t('distressed.laneCurated')
    return t('distressed.lanePermissionless')
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-mp/50 space-y-3">
        <div>
          <h2 className="font-display font-semibold text-sm text-ink tracking-tight">
            {t('distressed.filtersTitle')}
          </h2>
          <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{t('distressed.filtersSub')}</p>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('distressed.searchListings')}
            className="input-field w-full !py-2 !pl-9 !pr-3 text-xs font-chrome"
            aria-label={t('distressed.searchListings')}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LANES.map(l => (
            <button
              key={l}
              type="button"
              onClick={() => onLaneChange(l)}
              className={`rounded-chip border px-2.5 py-1 text-[10px] font-chrome transition-all duration-fast ${
                lane === l
                  ? 'border-btc-orange/35 bg-btc-orange-soft/60 text-mp-btc-text shadow-mp-1'
                  : 'border-mp/70 text-ink-muted hover:border-btc-orange/25 hover:text-ink'
              }`}
            >
              {laneLabel(l)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 font-chrome">
          <label className="flex items-center gap-1.5 text-[10px] text-ink-muted uppercase tracking-wider">
            {t('distressed.filterRegion')}
            <select
              value={filters.region}
              onChange={e => onFiltersChange({ ...filters, region: e.target.value })}
              className="select-field !py-1 !px-2 text-xs min-w-[5.5rem] normal-case tracking-normal"
            >
              {regions.map(r => (
                <option key={r} value={r}>
                  {r === 'all' ? t('distressed.regionAll') : r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] text-ink-muted uppercase tracking-wider">
            {t('distressed.filterMinScore')}
            <select
              value={filters.minScore}
              onChange={e => onFiltersChange({ ...filters, minScore: Number(e.target.value) })}
              className="select-field !py-1 !px-2 text-xs normal-case tracking-normal"
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] text-ink-muted uppercase tracking-wider">
            {t('distressed.filterMaxAsk')}
            <select
              value={filters.maxBtcUsd}
              onChange={e => onFiltersChange({ ...filters, maxBtcUsd: Number(e.target.value) })}
              className="select-field !py-1 !px-2 text-xs normal-case tracking-normal"
            >
              {MAX_ASK_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {'key' in opt ? t(opt.key) : opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          <span>
            {loading
              ? t('distressed.loading')
              : formatT(t, 'distressed.listingCount', { count: filtered.length })}
          </span>
          {debounced && listings.length !== filtered.length && (
            <span className="text-ink-muted/80 normal-case tracking-normal font-body">
              {filtered.length} of {listings.length}
            </span>
          )}
          {!loading && filtered.length !== totalCount && (
            <span className="text-ink-muted/70 normal-case tracking-normal font-body shrink-0">
              {formatT(t, 'distressed.filteredOfTotal', { shown: filtered.length, total: totalCount })}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2 btcmap-directory-scroll">
        <DistressedListingsList
          listings={filtered}
          loading={loading}
          error={error}
          onSelect={onSelectListing}
        />
      </div>
    </div>
  )
}