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
 * On a wide screen the region rail stretches each chip to the rail width.
 */
export function Chip({ label, active = false, onClick, count }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative inline-flex shrink-0 items-center gap-2 rounded-chip border px-3 py-1.5 font-chrome text-xs font-medium transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-btc-orange lg:w-full lg:justify-between ${
        active
          ? 'border-mp-btc/50 text-mp-btc-text'
          : 'border-mp-border bg-mp-card text-mp-ink-secondary hover:border-mp-border-strong hover:bg-mp-section hover:text-mp-ink'
      }`}
    >
      {active && (
        <motion.span
          layoutId="chip-active-fill"
          className="absolute inset-0 -z-10 rounded-chip bg-mp-btc-soft"
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        />
      )}
      <span className="relative">{label}</span>
      {typeof count === 'number' && (
        <span
          className={`relative inline-flex min-w-[1.35rem] items-center justify-center rounded-full px-1.5 py-px font-mono text-[10px] tabular-nums ${
            active ? 'bg-mp-btc/20 text-mp-btc-text' : 'bg-mp-section text-mp-ink-tertiary'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
