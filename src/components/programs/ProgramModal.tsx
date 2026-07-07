import { ClassyModal } from '../ui/ClassyModal';
import { ProofBadge } from '../ui/ProofBadge';
import { StatCard } from '../ui/StatCard';
import { Program, scoreWeight } from './types';

interface ProgramModalProps {
  program: Program | null;
  onClose: () => void;
  onAddToStack: (program: Program) => void;
}

/**
 * ProgramModal
 * Reuses the ClassyModal shell for consistent bottom-sheet/dialog behavior,
 * but renders finance-dense content: stat grid, proof reference, and a
 * single "Add to my stack" action (never "Explore" / "Learn More").
 * Mobile: stat grid drops to 2 columns instead of 3.
 */
export function ProgramModal({ program, onClose, onAddToStack }: ProgramModalProps) {
  if (!program) return null;
  const isFlagship = scoreWeight(program.sovereigntyScore) === 'flagship';

  return (
    <ClassyModal
      open={!!program}
      onClose={onClose}
      eyebrow={`${program.tier} · ${program.region}`}
      title={program.country}
    >
      <div className="mb-4 flex items-center gap-3">
        <ProofBadge status={program.proofStatus} txHint={program.proofRef} />
        {isFlagship && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-mp-btc-text">Flagship program</span>
        )}
      </div>

      <p>{program.summary}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Min. investment" value={`$${program.minInvestment.toLocaleString()}`} />
        <StatCard label="Avg. timeline" value={`${program.timelineDays}d`} />
        <StatCard label="Sovereignty score" value={`${program.sovereigntyScore}/100`} />
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-mp-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] text-mp-ink-tertiary">
          Figures modeled from public program terms &middot; not legal advice
        </p>
        <button
          type="button"
          onClick={() => onAddToStack(program)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-mp-btc px-6 py-3 font-chrome text-sm font-semibold text-mp-ink-on-accent shadow-mp-glow transition-transform duration-fast ease-spring-snappy hover:-translate-y-0.5"
        >
          Add to my stack
        </button>
      </div>
    </ClassyModal>
  );
}
