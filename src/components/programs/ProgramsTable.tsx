import type { KeyboardEvent, MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { ProofBadge } from '../ui/ProofBadge';
import { Program, scoreWeight } from './types';
import { cinematicIdToNumber } from '../../lib/programAdapter';

interface ProgramsTableProps {
  programs: Program[];
  onSelect: (program: Program) => void;
  portfolioIds?: number[];
  onTogglePortfolio?: (program: Program) => void;
}

/**
 * ProgramsTable
 * Desktop-only dense table — a family office scanning 50 jurisdictions wants
 * rows, not tiles. Flagship rows (score ≥85) get a left amber rule instead
 * of a full card treatment, keeping density high without losing hierarchy.
 * Not used on mobile — ProgramsPage swaps to ProgramCard stack below `lg`.
 */
export function ProgramsTable({
  programs,
  onSelect,
  portfolioIds = [],
  onTogglePortfolio,
}: ProgramsTableProps) {
  const portfolioSet = new Set(portfolioIds);

  return (
    <table className="w-full border-separate border-spacing-0 text-left" aria-label="Residency and citizenship programs">
      <caption className="sr-only">Residency and citizenship programs by jurisdiction</caption>
      <thead>
        <tr className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary">
          {onTogglePortfolio && (
            <th className="border-b border-mp-border-subtle py-3 pr-2 font-medium w-10">
              <span className="sr-only">In portfolio</span>
            </th>
          )}
          <th className="border-b border-mp-border-subtle py-3 pr-4 font-medium">Jurisdiction</th>
          <th className="border-b border-mp-border-subtle py-3 pr-4 font-medium">Tier</th>
          <th className="border-b border-mp-border-subtle py-3 pr-4 text-right font-medium">Min. invest</th>
          <th className="border-b border-mp-border-subtle py-3 pr-4 text-right font-medium">Timeline</th>
          <th className="border-b border-mp-border-subtle py-3 pr-4 text-right font-medium">Score</th>
          <th className="border-b border-mp-border-subtle py-3 pr-4 font-medium">Proof</th>
        </tr>
      </thead>
      <tbody>
        {programs.map((p, i) => {
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
                isFlagship ? 'border-l-2 border-l-mp-btc' : 'border-l-2 border-l-transparent'
              }`}
            >
              {onTogglePortfolio && (
                <td className="border-b border-mp-border-subtle py-3 pr-2">
                  <button
                    type="button"
                    onClick={handleToggle}
                    aria-label={inPortfolio ? 'Remove from portfolio' : 'Add to portfolio'}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-fast ${
                      inPortfolio
                        ? 'border-mp-btc/40 bg-mp-btc-soft text-mp-btc-text'
                        : 'border-mp-border bg-mp-section text-mp-ink-tertiary hover:border-mp-btc/30 hover:text-mp-btc-text'
                    }`}
                  >
                    <Check size={13} strokeWidth={inPortfolio ? 2.5 : 2} />
                  </button>
                </td>
              )}
              <td className="border-b border-mp-border-subtle py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mp-section font-mono text-[10px] text-mp-ink-secondary">
                    {p.countryCode}
                  </span>
                  <span className="font-display text-sm text-mp-ink">{p.country}</span>
                </div>
              </td>
              <td className="border-b border-mp-border-subtle py-3 pr-4 font-chrome text-xs text-mp-ink-secondary">
                {p.tier}
              </td>
              <td className="border-b border-mp-border-subtle py-3 pr-4 text-right font-mono text-sm text-mp-ink">
                ${(p.minInvestment / 1000).toFixed(0)}k
              </td>
              <td className="border-b border-mp-border-subtle py-3 pr-4 text-right font-mono text-sm text-mp-ink">
                {p.timelineDays}d
              </td>
              <td
                className={`border-b border-mp-border-subtle py-3 pr-4 text-right font-mono text-sm ${
                  isFlagship ? 'text-mp-btc-text' : 'text-mp-ink'
                }`}
              >
                {p.sovereigntyScore}
              </td>
              <td className="border-b border-mp-border-subtle py-3 pr-4">
                <ProofBadge status={p.proofStatus} compact />
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
}