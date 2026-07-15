import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, ExternalLink } from 'lucide-react'
import { DistressedKimiTierTooltip } from './DistressedKimiTierTooltip'
import { BtcDualPrice } from '../BtcDualPrice'
import { ProofBadge } from '../ui/ProofBadge'
import { useI18n } from '../../i18n/I18nContext'
import { similarDistressedListings } from '../../lib/distressedSimilar'
import { satohashVerifyUrl } from '../../lib/seal/vaultVerify'
import type { DistressedListing } from '../../types/distressedListing'

function scoreChip(score: number) {
  if (score >= 4) return 'bg-btc-orange-soft/60 text-mp-btc-text border-btc-orange/35'
  if (score >= 3) return 'bg-mp-proof/10 text-mp-proof border-mp-proof/30'
  return 'bg-card-muted/60 text-ink-muted border-mp/60'
}

export function DistressedListingsList({
  listings,
  allListings,
  loading,
  error,
  onSelect,
}: {
  listings: DistressedListing[]
  allListings: DistressedListing[]
  loading: boolean
  error: string | null
  onSelect: (listing: DistressedListing) => void
}) {
  const { t } = useI18n()
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set())

  if (loading) {
    return <p className="text-sm text-ink-muted animate-pulse px-3 py-6">{t('distressed.loading')}</p>
  }

  if (error) {
    return <p className="text-sm text-status-amber px-3 py-6">{error}</p>
  }

  if (!listings.length) {
    return (
      <div className="px-3 py-8 text-center space-y-3">
        <p className="text-sm text-ink-muted">{t('distressed.noListings')}</p>
        <Link
          to="/apply#apply-gates-heading"
          className="inline-flex items-center gap-1 text-xs text-mp-btc-text hover:underline underline-offset-2 font-chrome"
        >
          {t('distressed.gateExplainerLink')}
        </Link>
      </div>
    )
  }

  const handleSelect = (listing: DistressedListing) => {
    if (listing.lane === 'permissionless' && !unlocked.has(listing.listing_id)) return
    onSelect(listing)
  }

  const unlock = (listing: DistressedListing, e: React.MouseEvent) => {
    e.stopPropagation()
    setUnlocked(prev => new Set(prev).add(listing.listing_id))
  }

  function onChipKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    chips: HTMLButtonElement[],
    index: number,
  ) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    e.stopPropagation()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const next = (index + dir + chips.length) % chips.length
    chips[next]?.focus()
  }

  return (
    <ul className="divide-y divide-mp/40">
      {listings.map(listing => {
        const similar = similarDistressedListings(listing, allListings)
        const isGold = listing.curated_tier === 'gold'
        const isCurated = listing.lane === 'curated'
        const gated = listing.lane === 'permissionless' && !unlocked.has(listing.listing_id)

        return (
          <li
            key={listing.listing_id}
            className={`group ${isGold ? 'distressed-row-gold' : isCurated ? 'distressed-row-curated' : ''}`}
          >
            <button
              type="button"
              onClick={() => handleSelect(listing)}
              className={`w-full text-left flex items-start gap-2 px-2 py-2.5 rounded-mp-md transition-all duration-base ${
                gated
                  ? 'opacity-90 hover:bg-section/40'
                  : 'hover:bg-section/60 hover:border-btc-orange/20'
              }`}
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
                <div
                  className="mt-0.5"
                  role="toolbar"
                  aria-label={t('distressed.pathwayChips')}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                >
                  <PathwayChip
                    label={listing.pathway_label}
                    active
                    onActivate={() => handleSelect(listing)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {gated ? (
                    <span className="text-[10px] font-mono text-status-amber inline-flex items-center gap-1">
                      <Lock size={10} /> Proof-gated
                    </span>
                  ) : (
                    <BtcDualPrice usd={listing.ask_usd} size="sm" />
                  )}
                  {isGold ? (
                    <DistressedKimiTierTooltip tier="gold" />
                  ) : isCurated ? (
                    <DistressedKimiTierTooltip tier="standard" />
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-chip border border-mp/60 text-ink-muted shrink-0">
                      {listing.lane}
                    </span>
                  )}
                  {listing.block_height != null && (
                    <ProofBadge status="verified" compact txHint={`#${listing.block_height}`} />
                  )}
                </div>

                {gated && (
                  <div className="mt-2 flex flex-wrap gap-2" onClick={e => e.stopPropagation()} role="presentation">
                    <button
                      type="button"
                      onClick={e => unlock(listing, e)}
                      className="btn-secondary text-[10px] !py-1 !px-2.5"
                    >
                      Verify proof to unlock
                    </button>
                    <a
                      href={satohashVerifyUrl(listing.content_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chip text-[10px] inline-flex items-center gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      Satohash <ExternalLink size={10} />
                    </a>
                  </div>
                )}

                {similar.length > 0 && !gated && (
                  <SimilarPathwayChips
                    similar={similar}
                    onSelect={onSelect}
                    onChipKeyDown={onChipKeyDown}
                    label={t('distressed.similarPrograms')}
                  />
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function PathwayChip({
  label,
  active,
  onActivate,
}: {
  label: string
  active?: boolean
  onActivate?: () => void
}) {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        onActivate?.()
      }}
      className={`rounded-chip border px-2 py-0.5 text-[10px] font-chrome max-w-full truncate transition-colors ${
        active
          ? 'border-btc-orange/35 bg-btc-orange-soft/40 text-mp-btc-text'
          : 'border-mp/60 bg-card-muted/40 text-ink-muted hover:border-btc-orange/30 hover:text-mp-btc-text'
      }`}
      title={label}
    >
      {label}
    </button>
  )
}

function SimilarPathwayChips({
  similar,
  onSelect,
  onChipKeyDown,
  label,
}: {
  similar: DistressedListing[]
  onSelect: (listing: DistressedListing) => void
  onChipKeyDown: (
    e: React.KeyboardEvent<HTMLButtonElement>,
    chips: HTMLButtonElement[],
    index: number,
  ) => void
  label: string
}) {
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-1"
      onClick={e => e.stopPropagation()}
      role="toolbar"
      aria-label={label}
      onKeyDown={e => e.stopPropagation()}
    >
      <span className="text-[9px] font-mono uppercase tracking-wider text-ink-muted/80 shrink-0">{label}</span>
      {similar.map((peer, i) => (
        <button
          key={peer.listing_id}
          ref={el => {
            chipRefs.current[i] = el
          }}
          type="button"
          onClick={e => {
            e.stopPropagation()
            onSelect(peer)
          }}
          onKeyDown={e => onChipKeyDown(e, chipRefs.current.filter(Boolean) as HTMLButtonElement[], i)}
          className="rounded-chip border border-mp/60 bg-card-muted/40 px-2 py-0.5 text-[10px] font-chrome text-ink-muted hover:border-btc-orange/30 hover:text-mp-btc-text transition-colors max-w-[9rem] truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-btc-orange/50"
          title={`${peer.pathway_label} · ${peer.program_name}`}
        >
          {peer.program_flag ? `${peer.program_flag} ` : ''}
          {peer.program_name}
        </button>
      ))}
    </div>
  )
}