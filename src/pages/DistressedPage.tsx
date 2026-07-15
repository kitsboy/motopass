import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, MessageCircle, TrendingDown } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { useBtcPrice } from '../context/BtcPriceContext'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { BtcDualPrice } from '../components/BtcDualPrice'
import { ProofBadge } from '../components/ui/ProofBadge'
import { ClassyModal } from '../components/ui/ClassyModal'
import { EscrowBuilder } from '../components/distressed/EscrowBuilder'
import {
  buildDistressedListings,
  distressedRegions,
  filterListings,
} from '../lib/distressed/buildListings'
import type { DistressedFilters, DistressedLane, DistressedListing } from '../types/distressedListing'

const DEFAULT_FILTERS: DistressedFilters = {
  region: 'all',
  minScore: 1,
  maxBtcUsd: 0,
}

function scoreChip(score: number) {
  if (score >= 4) return 'bg-btc-orange-soft text-mp-btc-text border-btc-orange/30'
  if (score >= 3) return 'bg-mp-proof-soft text-mp-proof border-mp-proof/30'
  return 'bg-mp-card-muted text-ink-muted border-mp-border'
}

function ListingCard({ listing, onSelect }: { listing: DistressedListing; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-card border border-mp-border bg-mp-card p-5 shadow-mp-1 text-left w-full hover:border-btc-orange/30 hover:shadow-mp-2 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-xs text-ink-muted font-mono uppercase">{listing.region}</span>
          <h3 className="font-display font-semibold text-ink mt-0.5">
            {listing.program_flag} {listing.program_name}
          </h3>
        </div>
        <span className={`rounded-chip border px-2 py-0.5 text-[10px] font-mono shrink-0 ${scoreChip(listing.distressed_score)}`}>
          {listing.distressed_score}/5
        </span>
      </div>
      <p className="text-xs text-ink-secondary line-clamp-2 mb-3">{listing.pathway_label}</p>
      <div className="flex items-end justify-between gap-2">
        <BtcDualPrice usd={listing.ask_usd} size="sm" />
        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-chip border ${
          listing.lane === 'curated'
            ? 'border-mp-proof/40 text-mp-proof bg-mp-proof-soft'
            : 'border-mp-border text-ink-muted'
        }`}>
          {listing.lane}
        </span>
      </div>
    </button>
  )
}

function ListingModal({
  listing,
  onClose,
}: {
  listing: DistressedListing | null
  onClose: () => void
}) {
  if (!listing) return null

  return (
    <ClassyModal
      open={!!listing}
      onClose={onClose}
      title={listing.program_name}
      subtitle={listing.pathway_label}
      eyebrow={listing.lane === 'curated' ? 'Kimi curated' : 'Permissionless · proof required'}
      maxWidth="xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <ProofBadge status="verified" compact />
          <BtcDualPrice usd={listing.ask_usd} size="md" />
          <span className={`rounded-chip border px-2 py-0.5 text-xs font-mono ${scoreChip(listing.distressed_score)}`}>
            distressed {listing.distressed_score}/5
          </span>
        </div>

        <p className="text-sm text-ink-secondary leading-relaxed">{listing.summary}</p>

        {listing.red_flags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-status-amber mb-1">Red flags</h4>
            <ul className="text-xs text-ink-muted list-disc pl-4 space-y-0.5">
              {listing.red_flags.map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {listing.optimization_tips.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-mp-proof mb-1">Optimization</h4>
            <ul className="text-xs text-ink-muted list-disc pl-4 space-y-0.5">
              {listing.optimization_tips.slice(0, 3).map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <a
            href={listing.proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs inline-flex items-center gap-1"
          >
            Satohash <ExternalLink size={12} />
          </a>
          {listing.ots_path && (
            <a href={listing.ots_path} download className="btn-secondary text-xs">
              Download .ots
            </a>
          )}
          <Link to="/vault" className="btn-secondary text-xs" onClick={onClose}>
            Verify in Vault
          </Link>
          <Link
            to={`/apply?program=${encodeURIComponent(listing.program_name)}`}
            className="btn-primary text-xs"
            onClick={onClose}
          >
            Apply
          </Link>
          <Link
            to={`/btcmap?country=${listing.btcmap_country_slug}`}
            className="btn-secondary text-xs"
            onClick={onClose}
          >
            BTC Map
          </Link>
        </div>

        <EscrowBuilder listing={listing} />

        <Link
          to="/agents"
          className="chip text-xs inline-flex items-center gap-1.5 !text-nostr-violet !border-nostr-violet/30 w-full justify-center py-2"
          onClick={onClose}
        >
          <MessageCircle size={14} />
          Deal room — escalate to Kimi agent
        </Link>

        {listing.lane === 'permissionless' && (
          <p className="text-[10px] text-ink-muted font-mono text-center">
            Buyer beware — permissionless lane requires proof_url; MotoPass does not custody funds.
          </p>
        )}
      </div>
    </ClassyModal>
  )
}

export function DistressedPage() {
  const { programs, loading, error } = usePrograms()
  const { rate } = useBtcPrice()
  const [lane, setLane] = useState<DistressedLane>('all')
  const [filters, setFilters] = useState<DistressedFilters>(DEFAULT_FILTERS)
  const [active, setActive] = useState<DistressedListing | null>(null)

  const allListings = useMemo(() => buildDistressedListings(programs), [programs])
  const regions = useMemo(() => ['all', ...distressedRegions(allListings)], [allListings])
  const filtered = useMemo(
    () => filterListings(allListings, lane, filters),
    [allListings, lane, filters],
  )

  const curatedCount = allListings.filter(l => l.lane === 'curated').length

  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="FORGE · MARKETPLACE"
        title="Distressed sovereign plays"
        subtitle="Proof-gated listings — curated by Kimi or permissionless with Satohash + OTS. ₿ asks, template escrow only."
      />

      <div className="rounded-card border border-btc-orange/20 bg-gradient-to-br from-btc-orange-soft/40 to-mp-card p-5 mb-8 flex flex-wrap items-center gap-4">
        <TrendingDown className="text-btc-orange shrink-0" size={28} />
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-display font-semibold text-ink">
            {filtered.length} active listings · {curatedCount} curated
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            Spot ₿1 ≈ ${rate.toLocaleString()} — all asks shown in ₿ first
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'curated', 'permissionless'] as DistressedLane[]).map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setLane(l)}
            className={`rounded-chip border px-3 py-1.5 text-xs font-chrome capitalize transition-colors ${
              lane === l
                ? 'border-btc-orange/35 bg-btc-orange-soft text-mp-btc-text'
                : 'border-mp-border text-ink-muted hover:border-mp-strong'
            }`}
          >
            {l === 'all' ? 'All lanes' : l}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          Region
          <select
            value={filters.region}
            onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}
            className="rounded-mp-md border border-mp-border bg-mp-card px-2 py-1 text-ink text-xs"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          Min score
          <select
            value={filters.minScore}
            onChange={e => setFilters(f => ({ ...f, minScore: Number(e.target.value) }))}
            className="rounded-mp-md border border-mp-border bg-mp-card px-2 py-1 text-ink text-xs"
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          Max ask (USD)
          <select
            value={filters.maxBtcUsd}
            onChange={e => setFilters(f => ({ ...f, maxBtcUsd: Number(e.target.value) }))}
            className="rounded-mp-md border border-mp-border bg-mp-card px-2 py-1 text-ink text-xs"
          >
            <option value={0}>Any</option>
            <option value={50000}>$50k</option>
            <option value={100000}>$100k</option>
            <option value={250000}>$250k</option>
            <option value={500000}>$500k</option>
          </select>
        </label>
      </div>

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton />}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-card border border-mp-border bg-mp-card-muted text-ink-muted text-sm">
              No listings match filters — try lowering min score or switching lane.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(listing => (
                <ListingCard
                  key={listing.listing_id}
                  listing={listing}
                  onSelect={() => setActive(listing)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ListingModal listing={active} onClose={() => setActive(null)} />
    </div>
  )
}