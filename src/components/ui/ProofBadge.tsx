import { CheckCircle2, Clock, FlaskConical, FileWarning } from 'lucide-react';
import sliceStatus from '../../data/sliceStatus.json';

export type ProofStatus = 'verified' | 'recorded' | 'pending' | 'demo' | 'stale';

/**
 * True when the record's content no longer matches the hash its stamp covers.
 * Generated at build time by scripts/check-slice-hashes.mjs --write.
 */
export function sliceDrifted(name: string | undefined): boolean {
  if (!name) return false;
  const row = (sliceStatus as Record<string, { inSync: boolean }>)[name];
  return Boolean(row) && row.inSync === false;
}

interface ProofBadgeProps {
  status: ProofStatus;
  compact?: boolean;
  txHint?: string;
  /** When given, a record edited since its stamp downgrades to 'stale'. */
  programName?: string;
  /** ISO stamp time, so the badge can say when instead of "verified". */
  stampedAt?: string | null;
}

/**
 * ProofBadge — Satohash/OpenTimestamps anchor state.
 * demo = placeholder hash in seed data (not yet stamped on Bitcoin).
 */
export function ProofBadge({
  status: rawStatus,
  compact = false,
  txHint,
  programName,
  stampedAt,
}: ProofBadgeProps) {
  // A stamp only vouches for the content it covered. If the record has moved
  // since, the honest label is "changed since last timestamp".
  const status: ProofStatus = programName && sliceDrifted(programName) ? 'stale' : rawStatus;
  const styles =
    status === 'verified'
      ? 'border-mp-border bg-mp-section text-mp-ink-secondary'
      : status === 'recorded'
        ? 'border-btc-orange/35 bg-btc-orange-soft/50 text-mp-btc-text'
        : status === 'demo'
          ? 'border-mp-border-strong bg-mp-section text-mp-ink-secondary dark:text-mp-ink-secondary'
          : 'border-mp-ochre/40 bg-mp-btc-soft text-mp-btc-text';

  const label =
    status === 'verified'
      ? stampedAt
        ? `Timestamped ${new Date(stampedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`
        : 'Timestamped'
      : status === 'pending' && !stampedAt
        ? 'Stamp pending'
      : status === 'recorded'
        ? 'Proof on file'
        : status === 'demo'
          ? 'Demo Anchor'
          : status === 'stale'
            ? 'Changed since last timestamp'
            : 'Anchor Pending';

  const Icon =
    status === 'verified' ? CheckCircle2 : status === 'demo' ? FlaskConical : status === 'stale' ? FileWarning : Clock;

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