import { BtcDualPrice } from '../BtcDualPrice'
import { useI18n } from '../../i18n/I18nContext'
import type { DistressedListing } from '../../types/distressedListing'

function scoreChip(score: number) {
  if (score >= 4) return 'bg-btc-orange-soft/60 text-mp-btc-text border-btc-orange/35'
  if (score >= 3) return 'bg-mp-proof/10 text-mp-proof border-mp-proof/30'
  return 'bg-card-muted/60 text-ink-muted border-mp/60'
}

export function DistressedListingsList({
  listings,
  loading,
  error,
  onSelect,
}: {
  listings: DistressedListing[]
  loading: boolean
  error: string | null
  onSelect: (listing: DistressedListing) => void
}) {
  const { t } = useI18n()

  if (loading) {
    return <p className="text-sm text-ink-muted animate-pulse px-3 py-6">{t('distressed.loading')}</p>
  }

  if (error) {
    return <p className="text-sm text-status-amber px-3 py-6">{error}</p>
  }

  if (!listings.length) {
    return <p className="text-sm text-ink-muted px-3 py-6">{t('distressed.noListings')}</p>
  }

  return (
    <ul className="divide-y divide-mp/40">
      {listings.map(listing => (
        <li key={listing.listing_id} className="group">
          <button
            type="button"
            onClick={() => onSelect(listing)}
            className="w-full text-left flex items-start gap-2 px-2 py-2.5 rounded-mp-md transition-colors hover:bg-section/60"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-ink-muted font-mono uppercase tracking-wider">
                    {listing.region}
                  </span>
                  <div className="font-chrome text-sm font-medium text-ink truncate group-hover:text-mp-btc-text transition-colors">
                    {listing.program_flag} {listing.program_name}
                  </div>
                </div>
                <span
                  className={`rounded-chip border px-2 py-0.5 text-[10px] font-mono shrink-0 ${scoreChip(listing.distressed_score)}`}
                >
                  {listing.distressed_score}/5
                </span>
              </div>
              <p className="text-[11px] text-ink-muted truncate mt-0.5">{listing.pathway_label}</p>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <BtcDualPrice usd={listing.ask_usd} size="sm" />
                <span
                  className={`text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-chip border shrink-0 ${
                    listing.lane === 'curated'
                      ? 'border-mp-proof/40 text-mp-proof bg-mp-proof/10'
                      : 'border-mp/60 text-ink-muted'
                  }`}
                >
                  {listing.lane}
                </span>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}