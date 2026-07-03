import { CheckCircle2, Clock } from 'lucide-react';

interface ProofBadgeProps {
  status: 'verified' | 'pending';
  compact?: boolean;
  txHint?: string; // short satohash reference, e.g. "a3f9…21bc"
}

/**
 * ProofBadge
 * Wax-stamp-adjacent mono badge signaling a Satohash/OpenTimestamps anchor.
 * Green = verified, ochre = pending. Never uses the Bitcoin orange alone —
 * proof green is reserved so it doesn't compete visually with CTAs.
 * Mobile: compact mode drops the tx hint, keeps only icon + label.
 */
export function ProofBadge({ status, compact = false, txHint }: ProofBadgeProps) {
  const isVerified = status === 'verified';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] ${
        isVerified
          ? 'border-mp-proof/30 bg-mp-proof-soft text-mp-proof'
          : 'border-mp-ochre/30 bg-mp-btc-soft text-mp-ochre'
      }`}
      role="status"
    >
      {isVerified ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <Clock className="h-3 w-3" aria-hidden="true" />}
      <span>{isVerified ? 'Satohash Verified' : 'Anchor Pending'}</span>
      {!compact && txHint && <span className="text-mp-ink-tertiary">&middot; {txHint}</span>}
    </span>
  );
}
