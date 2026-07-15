import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, MessageCircle, TrendingDown, Layers, Shield, BarChart3, Handshake } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { usePrograms } from '../hooks/usePrograms'
import { useBtcPrice } from '../context/BtcPriceContext'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { BtcDualPrice } from '../components/BtcDualPrice'
import { ProofBadge } from '../components/ui/ProofBadge'
import { ClassyModal } from '../components/ui/ClassyModal'
import { Card } from '../components/ui/Card'
import { HowItWorksSection } from '../components/ui/HowItWorksSection'
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
  if (score >= 4) return 'bg-btc-orange-soft/60 text-mp-btc-text border-btc-orange/35'
  if (score >= 3) return 'bg-mp-proof/10 text-mp-proof border-mp-proof/30'
  return 'bg-card-muted/60 text-ink-muted border-mp/60'
}

function ListingCard({
  listing,
  onSelect,
  index,
}: {
  listing: DistressedListing
  onSelect: () => void
  index: number
}) {
  return (
    <Card
      variant="interactive"
      animate
      delay={0.04 + index * 0.03}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className="text-left w-full !p-5"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <span className="text-[10px] text-ink-muted font-mono uppercase tracking-wider">{listing.region}</span>
          <h3 className="font-display font-semibold text-ink mt-0.5 truncate">
            {listing.program_flag} {listing.program_name}
          </h3>
        </div>
        <span className={`rounded-chip border px-2 py-0.5 text-[10px] font-mono shrink-0 ${scoreChip(listing.distressed_score)}`}>
          {listing.distressed_score}/5
        </span>
      </div>
      <p className="font-body text-xs text-ink-secondary line-clamp-2 mb-4 leading-relaxed">{listing.pathway_label}</p>
      <div className="flex items-end justify-between gap-2 pt-2 border-t border-mp/40">
        <BtcDualPrice usd={listing.ask_usd} size="sm" />
        <span
          className={`text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-chip border ${
            listing.lane === 'curated'
              ? 'border-mp-proof/40 text-mp-proof bg-mp-proof/10'
              : 'border-mp/60 text-ink-muted'
          }`}
        >
          {listing.lane}
        </span>
      </div>
    </Card>
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

        <p className="font-body text-sm text-ink-secondary leading-relaxed">{listing.summary}</p>

        {listing.red_flags.length > 0 && (
          <div>
            <h4 className="font-chrome text-xs font-semibold text-status-amber mb-1">Red flags</h4>
            <ul className="font-body text-xs text-ink-muted list-disc pl-4 space-y-0.5">
              {listing.red_flags.map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {listing.optimization_tips.length > 0 && (
          <div>
            <h4 className="font-chrome text-xs font-semibold text-mp-proof mb-1">Optimization</h4>
            <ul className="font-body text-xs text-ink-muted list-disc pl-4 space-y-0.5">
              {listing.optimization_tips.slice(0, 3).map(tip => (
                <li key={tip}>{tip}</li>
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
          <p className="text-[10px] text-ink-muted font-mono text-center opacity-70">
            Buyer beware — permissionless lane requires proof_url; MotoPass does not custody funds.
          </p>
        )}
      </div>
    </ClassyModal>
  )
}

export function DistressedPage() {
  const { t } = useI18n()
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
    <div className="page-container px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="MEMBERS · FORGE · MARKETPLACE"
        title="Distressed sovereign plays"
        subtitle="Proof-gated listings — curated by Kimi or permissionless with Satohash + OTS. ₿ asks, template escrow only."
      />

      <HowItWorksSection
        eyebrow={t('distressed.how.eyebrow')}
        title={t('distressed.how.title')}
        intro={t('distressed.how.intro')}
        footerNote={t('distressed.how.footer')}
        steps={[
          { n: '01', title: t('distressed.how.step1.title'), body: t('distressed.how.step1.body'), icon: Layers },
          { n: '02', title: t('distressed.how.step2.title'), body: t('distressed.how.step2.body'), icon: Shield },
          { n: '03', title: t('distressed.how.step3.title'), body: t('distressed.how.step3.body'), icon: BarChart3 },
          {
            n: '04',
            title: t('distressed.how.step4.title'),
            body: t('distressed.how.step4.body'),
            icon: Handshake,
            link: { to: '/vault', label: 'Verify proofs in Vault' },
          },
        ]}
      />

      <Card variant="banner" animate className="mb-8 flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-mp-md bg-btc-orange/12 border border-btc-orange/25">
          <TrendingDown className="text-btc-orange" size={24} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-display text-sm font-semibold text-ink">
            {filtered.length} active listings · {curatedCount} curated
          </p>
          <p className="font-mono text-xs text-ink-muted mt-1 opacity-80">
            Spot ₿1 ≈ ${rate.toLocaleString()} — all asks shown in ₿ first
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'curated', 'permissionless'] as DistressedLane[]).map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setLane(l)}
            className={`rounded-chip border px-3 py-1.5 text-xs font-chrome capitalize transition-all duration-fast ${
              lane === l
                ? 'border-btc-orange/35 bg-btc-orange-soft/60 text-mp-btc-text shadow-mp-1'
                : 'border-mp/70 text-ink-muted hover:border-btc-orange/25 hover:text-ink'
            }`}
          >
            {l === 'all' ? 'All lanes' : l}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-8 font-chrome">
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          Region
          <select
            value={filters.region}
            onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}
            className="select-field !py-1.5 !px-2 text-xs min-w-[6rem]"
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
            className="select-field !py-1.5 !px-2 text-xs"
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
            className="select-field !py-1.5 !px-2 text-xs"
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
      {loading && !error && <CardSkeleton count={6} />}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <Card className="text-center py-16 text-ink-muted font-body text-sm">
              No listings match filters — try lowering min score or switching lane.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((listing, i) => (
                <ListingCard
                  key={listing.listing_id}
                  listing={listing}
                  index={i}
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