import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ProofBadge } from '../ui/ProofBadge';
import { LazyFlagSprite } from '../pitch/LazyFlagSprite';
import { BtcDualPrice } from '../BtcDualPrice';
import type { ProgramsTableDensity } from '../../lib/portfolioStorage';
import { useI18n } from '../../i18n/I18nContext';
import { tierTooltipKey } from '../../lib/programTier';
import { Program, scoreWeight } from './types';
import { cinematicIdToNumber } from '../../lib/programAdapter';
import { SovereigntyScoreTooltip } from './SovereigntyScoreTooltip';

interface ProgramsTableProps {
  programs: Program[];
  onSelect: (program: Program) => void;
  portfolioIds?: number[];
  onTogglePortfolio?: (program: Program) => void;
  density?: ProgramsTableDensity;
}

/**
 * ProgramsTable
 * Desktop-only dense table — a family office scanning 50 jurisdictions wants
 * rows, not tiles. Flagship rows (score ≥85) get a left amber rule instead
 * of a full card treatment, keeping density high without losing hierarchy.
 * Not used on mobile — ProgramsPage swaps to ProgramCard stack below `lg`.
 */
type SortDir = 'asc' | 'desc' | null

export function ProgramsTable({
  programs,
  onSelect,
  portfolioIds = [],
  onTogglePortfolio,
  density = 'comfortable',
}: ProgramsTableProps) {
  const { t } = useI18n();
  const [scoreSort, setScoreSort] = useState<SortDir>(null);
  const portfolioSet = new Set(portfolioIds);
  const compact = density === 'compact';
  const cellPad = compact ? 'py-2' : 'py-3';
  const toggleSize = compact ? 'h-6 w-6' : 'h-7 w-7';

  const sortedPrograms = useMemo(() => {
    if (!scoreSort) return programs;
    return [...programs].sort((a, b) => {
      const diff = a.sovereigntyScore - b.sovereigntyScore;
      return scoreSort === 'asc' ? diff : -diff;
    });
  }, [programs, scoreSort]);

  const toggleScoreSort = () => {
    setScoreSort(prev => (prev === null ? 'desc' : prev === 'desc' ? 'asc' : null));
  };

  return (
    <table
      className={`w-full border-separate border-spacing-0 text-start programs-table-sticky mp-table-zebra ${compact ? 'programs-table-compact' : 'programs-table-comfortable'}`}
      aria-label="Residency and citizenship programs"
    >
      <caption className="sr-only">Residency and citizenship programs by jurisdiction</caption>
      <thead>
        <tr className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary">
          {onTogglePortfolio && (
            <th scope="col" className={`border-b border-mp-border-subtle ${cellPad} pe-2 font-medium w-10`}>
              <span className="sr-only">In portfolio</span>
            </th>
          )}
          <th scope="col" className={`border-b border-mp-border-subtle ${cellPad} pe-4 font-medium`}>Jurisdiction</th>
          <th scope="col" className={`border-b border-mp-border-subtle ${cellPad} pe-4 font-medium`}>Tier</th>
          <th scope="col" className={`border-b border-mp-border-subtle ${cellPad} pe-4 text-end font-medium`}>
            <span className="text-mp-btc-text">₿</span> Min. invest
          </th>
          <th scope="col" className={`border-b border-mp-border-subtle ${cellPad} pe-4 text-end font-medium`}>Timeline</th>
          <th scope="col" className={`border-b border-mp-border-subtle ${cellPad} pe-4 text-end font-medium`}>
            <button
              type="button"
              onClick={toggleScoreSort}
              className="inline-flex items-center gap-1 hover:text-mp-btc-text transition-colors"
              aria-label={t('programs.sortSovereignty')}
            >
              Score
              {scoreSort === 'desc' && <ChevronDown size={12} aria-hidden="true" />}
              {scoreSort === 'asc' && <ChevronUp size={12} aria-hidden="true" />}
            </button>
          </th>
          <th scope="col" className={`border-b border-mp-border-subtle ${cellPad} pe-4 font-medium`}>Proof</th>
        </tr>
      </thead>
      <tbody>
        {sortedPrograms.map((p, i) => {
          const isFlagship = scoreWeight(p.sovereigntyScore) === 'flagship';
          const inPortfolio = portfolioSet.has(cinematicIdToNumber(p.id));
          const activate = () => onSelect(p);
          const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              activate();
            }
          };
          const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onTogglePortfolio?.(p);
          };
          return (
            <motion.tr
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.03 }}
              tabIndex={0}
              role="button"
              onClick={activate}
              onKeyDown={onKeyDown}
              className={`cursor-pointer transition-colors duration-fast hover:bg-mp-section focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mp-btc ${
                isFlagship ? 'border-s-2 border-s-mp-btc' : 'border-s-2 border-s-transparent'
              }`}
            >
              {onTogglePortfolio && (
                <td className={`border-b border-mp-border-subtle ${cellPad} pe-2`}>
                  <button
                    type="button"
                    onClick={handleToggle}
                    aria-label={inPortfolio ? 'Remove from portfolio' : 'Add to portfolio'}
                    className={`flex ${toggleSize} items-center justify-center rounded-full border transition-colors duration-fast ${
                      inPortfolio
                        ? 'border-mp-btc/40 bg-mp-btc-soft text-mp-btc-text'
                        : 'border-mp-border bg-mp-section text-mp-ink-tertiary hover:border-mp-btc/30 hover:text-mp-btc-text'
                    }`}
                  >
                    <Check size={13} strokeWidth={inPortfolio ? 2.5 : 2} />
                  </button>
                </td>
              )}
              <td className={`border-b border-mp-border-subtle ${cellPad} pe-4`}>
                <div className="flex items-center gap-2.5">
                  <LazyFlagSprite
                    countryName={p.country}
                    emojiFallback={p.flag ?? p.countryCode}
                    className={compact ? 'h-5 w-5' : 'h-6 w-6'}
                  />
                  <span className={`font-display text-mp-ink ${compact ? 'text-xs' : 'text-sm'}`}>{p.country}</span>
                </div>
              </td>
              <td
                className={`border-b border-mp-border-subtle ${cellPad} pe-4 font-chrome text-xs text-mp-ink-secondary`}
                title={t(tierTooltipKey(p.tier))}
              >
                {p.tier}
              </td>
              <td className={`border-b border-mp-border-subtle ${cellPad} pe-4 text-end`}>
                <BtcDualPrice usd={p.minInvestment} size="xs" layout="stack" className="items-end" />
              </td>
              <td className={`border-b border-mp-border-subtle ${cellPad} pe-4 text-end font-mono text-sm text-mp-ink`}>
                {p.timelineDays}d
              </td>
              <td className={`border-b border-mp-border-subtle ${cellPad} pe-4 text-end`}>
                <SovereigntyScoreTooltip program={p} score={p.sovereigntyScore} isFlagship={isFlagship} />
              </td>
              <td className={`border-b border-mp-border-subtle ${cellPad} pe-4`}>
                <ProofBadge status={p.proofStatus} compact />
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
}