import { motion } from 'motion/react';
import { ProofBadge } from '../ui/ProofBadge';
import { Program, scoreWeight } from './types';

interface ProgramsTableProps {
  programs: Program[];
  onSelect: (program: Program) => void;
}

/**
 * ProgramsTable
 * Desktop-only dense table — a family office scanning 50 jurisdictions wants
 * rows, not tiles. Flagship rows (score ≥85) get a left amber rule instead
 * of a full card treatment, keeping density high without losing hierarchy.
 * Not used on mobile — ProgramsPage swaps to ProgramCard stack below `lg`.
 */
export function ProgramsTable({ programs, onSelect }: ProgramsTableProps) {
  return (
    <table className="w-full border-separate border-spacing-0 text-left">
      <thead>
        <tr className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary">
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
          return (
            <motion.tr
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.03 }}
              onClick={() => onSelect(p)}
              className={`cursor-pointer transition-colors duration-fast hover:bg-mp-section ${
                isFlagship ? 'border-l-2 border-l-mp-btc' : 'border-l-2 border-l-transparent'
              }`}
            >
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
