import { motion } from 'motion/react';

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

/**
 * Chip
 * Filter taxonomy pill. Active state fills with a spring-animated layout
 * transition (shared layoutId) rather than an instant color snap.
 * Mobile: chips sit in a horizontally scrollable row with no wrap.
 */
export function Chip({ label, active = false, onClick, count }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative shrink-0 rounded-chip border px-3.5 py-1.5 font-chrome text-xs font-medium transition-colors duration-fast ${
        active
          ? 'border-mp-btc/40 text-mp-btc-text'
          : 'border-mp-border text-mp-ink-secondary hover:border-mp-border-strong hover:text-mp-ink'
      }`}
    >
      {active && (
        <motion.span
          layoutId="chip-active-fill"
          className="absolute inset-0 -z-10 rounded-chip bg-mp-btc-soft"
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        />
      )}
      <span className="relative">
        {label}
        {typeof count === 'number' && (
          <span className="ml-1.5 font-mono text-[10px] text-mp-ink-tertiary">{count}</span>
        )}
      </span>
    </button>
  );
}
