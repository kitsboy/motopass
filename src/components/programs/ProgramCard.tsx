import { motion } from 'motion/react';
import { ProofBadge } from '../ui/ProofBadge';
import { Program, scoreWeight } from './types';

interface ProgramCardProps {
  program: Program;
  onSelect: (program: Program) => void;
  index?: number;
}

/**
 * ProgramCard
 * Mobile-primary presentation of a jurisdiction program (desktop defaults to
 * the dense ProgramsTable instead — see ProgramsPage). Visual weight scales
 * with sovereigntyScore: flagship programs (≥85) get a heavier amber border
 * and a wax-seal corner mark; standard programs stay quiet.
 * Mobile: full-width stacked card, tap anywhere opens ProgramModal.
 */
export function ProgramCard({ program, onSelect, index = 0 }: ProgramCardProps) {
  const weight = scoreWeight(program.sovereigntyScore);
  const isFlagship = weight === 'flagship';

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(program)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={`group relative w-full overflow-hidden rounded-card border bg-mp-card p-5 text-left shadow-mp-1 transition-[box-shadow,border-color] duration-base ease-spring-gentle hover:shadow-mp-3 ${
        isFlagship ? 'border-mp-btc/35 hover:border-mp-btc/55' : 'border-mp-border hover:border-mp-copper/40'
      }`}
    >
      {isFlagship && (
        <span
          className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-gradient-seal opacity-90"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-mp-border-subtle bg-mp-section font-mono text-[11px] font-medium text-mp-ink-secondary"
            aria-hidden="true"
          >
            {program.countryCode}
          </span>
          <div>
            <h3 className="font-display text-lg2 leading-tight text-mp-ink">{program.country}</h3>
            <span className="font-chrome text-[11px] uppercase tracking-wide text-mp-ink-tertiary">
              {program.tier} &middot; {program.region}
            </span>
          </div>
        </div>
        <ProofBadge status={program.proofStatus} compact />
      </div>

      <p className="mt-3 line-clamp-2 font-body text-sm text-mp-ink-secondary">{program.summary}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-mp-border-subtle pt-4">
        <div>
          <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">Min. invest</dt>
          <dd className="font-mono text-sm text-mp-ink">${(program.minInvestment / 1000).toFixed(0)}k</dd>
        </div>
        <div>
          <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">Timeline</dt>
          <dd className="font-mono text-sm text-mp-ink">{program.timelineDays}d</dd>
        </div>
        <div>
          <dt className="font-chrome text-[10px] uppercase tracking-wide text-mp-ink-tertiary">Score</dt>
          <dd className={`font-mono text-sm ${isFlagship ? 'text-mp-btc' : 'text-mp-ink'}`}>
            {program.sovereigntyScore}
          </dd>
        </div>
      </dl>
    </motion.button>
  );
}
