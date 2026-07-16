import { CheckCircle2, Clock, FlaskConical } from 'lucide-react';

export type ProofStatus = 'verified' | 'pending' | 'demo';

interface ProofBadgeProps {
  status: ProofStatus;
  compact?: boolean;
  txHint?: string;
}

/**
 * ProofBadge — Satohash/OpenTimestamps anchor state.
 * demo = placeholder hash in seed data (not yet stamped on Bitcoin).
 */
export function ProofBadge({ status, compact = false, txHint }: ProofBadgeProps) {
  const styles =
    status === 'verified'
      ? 'border-mp-proof/35 bg-mp-proof-soft text-mp-proof dark:border-mp-proof/45 dark:bg-mp-proof/15 dark:text-[#4ade80]'
      : status === 'demo'
        ? 'border-mp-border-strong bg-mp-section text-mp-ink-secondary dark:text-mp-ink-secondary'
        : 'border-mp-ochre/40 bg-mp-btc-soft text-mp-btc-text';

  const label =
    status === 'verified' ? 'Satohash Verified' : status === 'demo' ? 'Demo Anchor' : 'Anchor Pending';

  const Icon = status === 'verified' ? CheckCircle2 : status === 'demo' ? FlaskConical : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] ${styles}`}
      role="status"
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
      {!compact && txHint && <span className="text-mp-ink-tertiary">&middot; {txHint}</span>}
    </span>
  );
}