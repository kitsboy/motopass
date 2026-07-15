import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, MessageCircle, TrendingDown, Layers, Shield, BarChart3, Handshake } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { usePrograms } from '../hooks/usePrograms'
import { useBtcPrice } from '../context/BtcPriceContext'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { BtcDualPrice } from '../components/BtcDualPrice'
import { ProofBadge } from '../components/ui/ProofBadge'
import { ClassyModal } from '../components/ui/ClassyModal'
import { Card } from '../components/ui/Card'
import { HowItWorksSection } from '../components/ui/HowItWorksSection'
import { EscrowBuilder } from '../components/distressed/EscrowBuilder'
import { DistressedFilterDirectory } from '../components/distressed/DistressedFilterDirectory'
import { PageAnchorNav } from '../components/nav/PageAnchorNav'
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

  const distressedAnchors = useMemo(
    () => [
      { id: 'distressed-guide', label: t('subnav.distressed.guide') },
      { id: 'distressed-listings', label: t('subnav.distressed.listings') },
    ],
    [t],
  )

  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="MEMBERS · FORGE · MARKETPLACE"
        title="Distressed sovereign plays"
        subtitle="Proof-gated listings — curated by Kimi or permissionless with Satohash + OTS. ₿ asks, template escrow only."
      />

      <PageAnchorNav items={distressedAnchors} />

      <div id="distressed-guide" className="scroll-mt-header">
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
      </div>

      <div id="distressed-listings" className="scroll-mt-header">
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

      {error && <ProgramsLoadError message={error} />}
      {!error && (
        <Card
          variant="elevated"
          className="flex flex-col min-h-[min(420px,55vh)] lg:min-h-[min(640px,72vh)] max-h-[min(640px,72vh)] overflow-hidden !p-0"
        >
          <DistressedFilterDirectory
            listings={filtered}
            totalCount={allListings.length}
            regions={regions}
            lane={lane}
            onLaneChange={setLane}
            filters={filters}
            onFiltersChange={setFilters}
            loading={loading}
            error={null}
            onSelectListing={setActive}
          />
        </Card>
      )}

      </div>

      <ListingModal listing={active} onClose={() => setActive(null)} />
    </div>
  )
}