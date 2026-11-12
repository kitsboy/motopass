import { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Bell, Check, Zap } from 'lucide-react';
import { ProofBadge } from '../ui/ProofBadge';
import { CountryFlag } from '../ui/CountryTitle';
import { FreshnessBadge } from '../ui/FreshnessBadge';
import { SourcesProbedNote } from './SourcesProbedNote';
import { IntelStatusBadge } from '../intel/IntelStatusBadge';
import { SourceStatusBadge } from './SourceStatusBadge';
import { useI18n } from '../../i18n/I18nContext';
import { MerchantDensityBadge } from '../btcmap/MerchantDensityBadge';
import { BtcDualPrice } from '../BtcDualPrice';
import { cinematicIdToNumber } from '../../lib/programAdapter';
import { SovereigntyScoreTooltip } from './SovereigntyScoreTooltip';
import { DecisionClocks } from './DecisionClocks';
import { gazetteHits, gazetteLine } from '../../lib/gazetteWatch';
import { tierTooltipKey } from '../../lib/programTier';
import { Program, scoreWeight } from './types';
import { UnverifiedChip } from '../ui/UnverifiedNote';
import { FactsBadge } from './FactsBadge';

function GazetteCardLine({ program }: { program: Program }) {
  const { t } = useI18n();
  const line = gazetteLine(gazetteHits({
    sources: program.sources,
    officialUrls: program.legalCompliance?.official_urls,
    watchUrls: program.watchUrls,
  }));
  if (line === 'none') return null;
  const key = line === 'changed' ? 'gazette.changed' : line === 'watched' ? 'gazette.watched' : 'gazette.cited';
  return (
    <p className={`mt-2 font-mono text-[11px] uppercase tracking-wide ${line === 'cited' ? 'text-mp-ink-tertiary' : 'text-mp-ink'}`}>
      {t(key)}
    </p>
  );
}

interface ProgramCardProps {
  program: Program;
  onSelect: (program: Program) => void;
  index?: number;
  inPortfolio?: boolean;
  onTogglePortfolio?: (program: Program) => void;
  watched?: boolean;
  onToggleWatch?: (program: Program) => void;
  /** Opens the modal on its Evidence tab; the card itself clips a popover. */
  onShowEvidence?: (program: Program) => void;
}

/**
 * ProgramCard
 * Mobile-primary presentation of a jurisdiction program (desktop defaults to
 * the dense ProgramsTable instead — see ProgramsPage). Visual weight scales
 * with sovereigntyScore: flagship programs (≥85) get a heavier amber border
 * and a wax-seal corner mark; standard programs stay quiet.
 * Mobile: full-width stacked card, tap anywhere opens ProgramModal.
 */
export const ProgramCard = memo(function ProgramCard({
  program,
  onSelect,
  index = 0,
  inPortfolio = false,
  onTogglePortfolio,
  watched = false,
  onToggleWatch,
  onShowEvidence,
}: ProgramCardProps) {
  const weight = scoreWeight(program.sovereigntyScore);
  const isFlagship = weight === 'flagship';
  const reduceMotion = useReducedMotion();

  // The root is a div, not a button: the card already contains its own
  // watch/portfolio controls, and the facts badge is a third one.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(program);
    }
  };

  const cardClassName = `group relative w-full min-w-0 cursor-pointer overflow-hidden rounded-card border bg-mp-card p-5 text-left shadow-mp-1 transition-[box-shadow,border-color] duration-base ease-spring-gentle hover:shadow-mp-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mp-btc ${
    isFlagship ? 'border-mp-btc/35 hover:border-mp-btc/55' : 'border-mp-border hover:border-mp-copper/40'
  }`;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePortfolio?.(program);
  };

  const handleWatchToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWatch?.(program);
  };

  if (reduceMotion) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(program)}
        onKeyDown={handleKeyDown}
        className={cardClassName}
      >
        <ProgramCardContent
          program={program}
          isFlagship={isFlagship}
          inPortfolio={inPortfolio}
          onTogglePortfolio={onTogglePortfolio ? handleToggle : undefined}
          watched={watched}
          onToggleWatch={onToggleWatch ? handleWatchToggle : undefined}
          onShowEvidence={onShowEvidence}
        />
      </div>
    );
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(program)}
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={cardClassName}
    >
      <ProgramCardContent
        program={program}
        isFlagship={isFlagship}
        inPortfolio={inPortfolio}
        onTogglePortfolio={onTogglePortfolio ? handleToggle : undefined}
        watched={watched}
        onToggleWatch={onToggleWatch ? handleWatchToggle : undefined}
        onShowEvidence={onShowEvidence}
      />
    </motion.div>
  );
});

function ProgramCardContent({
  program,
  isFlagship,
  inPortfolio,
  onTogglePortfolio,
  watched,
  onToggleWatch,
  onShowEvidence,
}: {
  program: Program;
  isFlagship: boolean;
  inPortfolio: boolean;
  onTogglePortfolio?: (e: React.MouseEvent) => void;
  watched?: boolean;
  onToggleWatch?: (e: React.MouseEvent) => void;
  onShowEvidence?: (program: Program) => void;
}) {
  const { t } = useI18n();
  const freshnessLabels = {
    fresh: t('programs.freshnessFresh'),
    recent: t('programs.freshnessRecent'),
    stale: t('programs.freshnessStale'),
    proof: t('programs.freshnessProof'),
    checked: t('programs.freshnessChecked'),
  };

  return (
    <>
      {isFlagship && (
        <span
          className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-gradient-seal opacity-90"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <CountryFlag
            name={program.country}
            emoji={program.flag ?? program.countryCode}
            size="md"
          />
          <h3 className="min-w-0 flex-1 font-display text-lg2 leading-tight text-mp-ink">{program.country}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onToggleWatch && (
            <button
              type="button"
              onClick={onToggleWatch}
              aria-label={watched ? 'Remove from watch-list' : 'Watch for changes'}
              title={watched ? 'Remove from watch-list' : 'Watch for changes'}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-fast ${
                watched
                  ? 'border-btc-orange/45 bg-btc-orange-soft/60 text-btc-orange shadow-[0_0_10px_rgba(255,149,0,0.15)]'
                  : 'border-mp-border bg-mp-section text-mp-ink-tertiary hover:border-btc-orange/30 hover:text-btc-orange'
              }`}
            >
              <Bell size={13} strokeWidth={watched ? 2.5 : 2} />
            </button>
          )}
          {onTogglePortfolio && (
            <button
              type="button"
              onClick={onTogglePortfolio}
              aria-label={inPortfolio ? 'Remove from portfolio' : 'Add to portfolio'}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-fast ${
                inPortfolio
                  ? 'border-mp-btc/40 bg-mp-btc-soft text-mp-btc-text'
                  : 'border-mp-border bg-mp-section text-mp-ink-tertiary hover:border-mp-btc/30 hover:text-mp-btc-text'
              }`}
            >
              <Check size={14} strokeWidth={inPortfolio ? 2.5 : 2} />
            </button>
          )}
        </div>
      </div>
      <span
        className="mt-1 block max-w-full truncate font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary"
        title={`${program.tier} · ${program.region}. ${t(tierTooltipKey(program.tier))}`}
      >
        {program.tier} &middot; {program.region}
      </span>

      <div className="mt-2 flex w-full flex-wrap items-center gap-1.5">
        <DecisionClocks program={program} variant="pill" />
        {program.lightningReady && (
          <span className="inline-flex items-center gap-0.5 rounded-chip border border-mp-btc/30 bg-mp-btc-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-mp-btc-text">
            <Zap size={9} aria-hidden="true" />
            {t('modal.lightning')}
          </span>
        )}
        {program.highlightBtcFriendly && (
          <span className="inline-flex items-center gap-0.5 rounded-chip border border-mp-btc/50 bg-mp-btc-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-mp-btc-text">
            ₿ {t('programs.presetBitcoinFriendly')}
          </span>
        )}
        {program.policyMentionsBtc && (
          <span className="inline-flex items-center gap-0.5 rounded-chip border border-mp-copper/30 bg-mp-section px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-mp-copper">
            ₿ {t('programs.presetBitcoinPolicy')}
          </span>
        )}
        <FactsBadge
          program={program}
          onOpenEvidence={onShowEvidence ? () => onShowEvidence(program) : undefined}
        />
        <MerchantDensityBadge programName={program.country} programId={cinematicIdToNumber(program.id)} />
        <IntelStatusBadge programName={program.country} compact />
        <SourceStatusBadge programName={program.country} />
        <FreshnessBadge
          lastChecked={program.lastChecked}
          proofStampedAt={program.proofStampedAt}
          compact
          labels={freshnessLabels}
        />
        <ProofBadge status={program.proofStatus} compact programName={program.country} />
        <SourcesProbedNote iso={program.lastProbed} />
      </div>

      <p className="mt-3 line-clamp-2 font-body text-sm text-mp-ink-secondary">{program.summary}</p>
      {program.watchChanged && (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-mp-wax">{t('bell.cardLine')}</p>
      )}
      <GazetteCardLine program={program} />

      <div className="mt-4 border-t border-mp-border-subtle pt-4">
        <dl className="grid grid-cols-2 gap-2">
          <div>
            <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">
              {t('programs.minInvest')}
              {program.routeStatus && program.routeStatus !== 'unknown' && (
                <span className="ml-1.5 normal-case tracking-normal text-mp-ink-secondary">route {program.routeStatus}</span>
              )}
            </dt>
            <dd className="text-mp-ink">
              {program.minOnFile === false || !program.minInvestment ? (
                <span className="text-xs text-mp-ink-muted italic">not on file</span>
              ) : (
                <BtcDualPrice usd={program.minInvestment} size="xs" layout="stack" />
              )}
              {(program.unverifiedFigures ?? 0) > 0 && (
                <span className="mt-1 block">
                  <UnverifiedChip />
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">{t('programs.score')}</dt>
            <dd>
              <SovereigntyScoreTooltip program={program} score={program.sovereigntyScore} isFlagship={isFlagship} />
            </dd>
          </div>
        </dl>
        <DecisionClocks program={program} variant="strip" />
      </div>
    </>
  );
}