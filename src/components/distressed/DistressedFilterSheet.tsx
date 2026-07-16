import { useEffect, useRef } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import type { DistressedFilters, DistressedLane, DistressedSort } from '../../types/distressedListing'

const MAX_ASK_OPTIONS = [
  { value: 0, key: 'distressed.maxAskAny' as const },
  { value: 50_000, label: '$50k' },
  { value: 100_000, label: '$100k' },
  { value: 250_000, label: '$250k' },
  { value: 500_000, label: '$500k' },
] as const

const LANES: DistressedLane[] = ['all', 'curated', 'permissionless']

const SORT_OPTIONS: { id: DistressedSort; key: 'distressed.sortDiscount' | 'distressed.sortPrice' | 'distressed.sortRegion' }[] = [
  { id: 'discount', key: 'distressed.sortDiscount' },
  { id: 'price', key: 'distressed.sortPrice' },
  { id: 'region', key: 'distressed.sortRegion' },
]

type Props = {
  open: boolean
  onClose: () => void
  regions: string[]
  lane: DistressedLane
  onLaneChange: (lane: DistressedLane) => void
  sort: DistressedSort
  onSortChange: (sort: DistressedSort) => void
  filters: DistressedFilters
  onFiltersChange: (filters: DistressedFilters) => void
  laneCounts: Record<DistressedLane, number>
  activeFilterCount: number
}

export function DistressedFilterSheet({
  open,
  onClose,
  regions,
  lane,
  onLaneChange,
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  laneCounts,
  activeFilterCount,
}: Props) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useFocusTrap(panelRef, open, onClose)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  const instant = { duration: 0 } as const
  const panelTransition = reduced ? instant : { type: 'spring' as const, damping: 30, stiffness: 340 }

  const laneLabel = (l: DistressedLane) => {
    if (l === 'all') return t('distressed.laneAll')
    if (l === 'curated') return t('distressed.laneCurated')
    return t('distressed.lanePermissionless')
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="md:hidden fixed inset-0 z-[55]">
          <motion.button
            type="button"
            aria-label={t('common.close')}
            className="absolute inset-0 sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? instant : { duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('distressed.filterSheetTitle')}
            className="absolute inset-x-0 bottom-0 mobile-nav-glass rounded-t-2xl safe-bottom max-h-[min(85vh,640px)] overflow-y-auto"
            initial={reduced ? { y: 0, opacity: 1 } : { y: '100%' }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { y: 0, opacity: 0 } : { y: '100%' }}
            transition={panelTransition}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-mp/50 bg-card/95 backdrop-blur-md">
              <h3 className="font-display text-sm font-semibold text-ink">{t('distressed.filterSheetTitle')}</h3>
              <button type="button" onClick={onClose} className="chip !p-2" aria-label={t('common.close')}>
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div>
                <p className="text-[10px] font-chrome uppercase tracking-wider text-ink-muted mb-2">{t('distressed.laneAll')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {LANES.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => onLaneChange(l)}
                      aria-pressed={lane === l}
                      className={`rounded-chip border px-2.5 py-1 text-[10px] font-chrome transition-all duration-fast ${
                        lane === l
                          ? 'border-btc-orange/35 bg-btc-orange-soft/60 text-mp-btc-text shadow-mp-1'
                          : 'border-mp/70 text-ink-muted hover:border-btc-orange/25 hover:text-ink'
                      }`}
                    >
                      {laneLabel(l)}
                      <span className="ml-1 font-mono text-[9px] opacity-75">{laneCounts[l]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-chrome text-ink-secondary">
                <input
                  type="checkbox"
                  checked={filters.proofGatedOnly}
                  onChange={e => onFiltersChange({ ...filters, proofGatedOnly: e.target.checked })}
                  className="rounded border-mp"
                />
                {t('distressed.proofGatedOnly')}
              </label>

              <label className="flex items-center gap-2 text-xs font-chrome text-ink-secondary">
                <input
                  type="checkbox"
                  checked={filters.bookmarksOnly}
                  onChange={e => onFiltersChange({ ...filters, bookmarksOnly: e.target.checked })}
                  className="rounded border-mp"
                />
                {t('distressed.bookmarksOnly')}
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] text-ink-muted uppercase tracking-wider font-chrome">
                {t('distressed.sortBy')}
                <select
                  value={sort}
                  onChange={e => onSortChange(e.target.value as DistressedSort)}
                  className="select-field !py-2 !px-3 text-xs normal-case tracking-normal"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{t(opt.key)}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] text-ink-muted uppercase tracking-wider font-chrome">
                {t('distressed.filterRegion')}
                <select
                  value={filters.region}
                  onChange={e => onFiltersChange({ ...filters, region: e.target.value })}
                  className="select-field !py-2 !px-3 text-xs normal-case tracking-normal"
                >
                  {regions.map(r => (
                    <option key={r} value={r}>
                      {r === 'all' ? t('distressed.regionAll') : r}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-[10px] text-ink-muted uppercase tracking-wider font-chrome">
                  {t('distressed.filterMinScore')}
                  <select
                    value={filters.minScore}
                    onChange={e => onFiltersChange({ ...filters, minScore: Number(e.target.value) })}
                    className="select-field !py-2 !px-3 text-xs normal-case tracking-normal"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}+</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[10px] text-ink-muted uppercase tracking-wider font-chrome">
                  {t('distressed.filterMaxAsk')}
                  <select
                    value={filters.maxBtcUsd}
                    onChange={e => onFiltersChange({ ...filters, maxBtcUsd: Number(e.target.value) })}
                    className="select-field !py-2 !px-3 text-xs normal-case tracking-normal"
                  >
                    {MAX_ASK_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {'key' in opt ? t(opt.key) : opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button type="button" onClick={onClose} className="btn-primary w-full">
                {formatT(t, 'distressed.filterSheetApply', { count: activeFilterCount })}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function DistressedFilterSheetButton({
  activeFilterCount,
  open,
  onOpen,
}: {
  activeFilterCount: number
  open: boolean
  onOpen: () => void
}) {
  const { t } = useI18n()

  return (
    <button
      type="button"
      onClick={onOpen}
      className="md:hidden btn-secondary text-xs inline-flex items-center gap-1.5 w-full justify-center !py-2"
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <SlidersHorizontal size={14} aria-hidden />
      {t('distressed.filterSheetOpen')}
      {activeFilterCount > 0 && (
        <span className="rounded-chip border border-btc-orange/35 bg-btc-orange-soft/50 text-mp-btc-text text-[10px] font-mono px-1.5 py-0.5">
          {activeFilterCount}
        </span>
      )}
    </button>
  )
}