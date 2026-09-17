import { stateFromVerdict } from './HowProofWorks'
import type { ChainVerdict } from '../../lib/chainVerify'

/**
 * ProofStatusBadge — the "proven then vs valid now" honesty split, visible.
 *
 * WHY IT EXISTS (Rosa t_48326b11 §6.3 — the non-negotiable honesty feature)
 * -----------------------------------------------------------------------
 * An OpenTimestamps proof says a fingerprint existed NO LATER THAN a Bitcoin
 * block. It says nothing about whether the thing is still true today: a
 * residency approval can be proven-then AND revoked-now. Merging those two
 * truths into one green tick is the single most common lie in this product
 * category, so MotoPass renders them as two separate, separately-sourced rows:
 *
 *   proven then  — the .ots + block proof. Never expires, needs no trust.
 *   valid now    — the live registry's current answer. Revocable, always dated.
 *
 * The badge NEVER says "current" unless a live check said so. With no live
 * registry wired yet, the honest default is "unconfirmed as of <time>" — not a
 * guess, and never the anchor dressed up as present-tense truth.
 *
 * Ported family doctrine: HowProofWorks (kitsboy/satohash, verbatim in
 * ./HowProofWorks.jsx) owns the proof half; this component owns the validity
 * half. Candidate for backport into the shared trust kit.
 */

export interface ProofStatusLabels {
  provenNowHeading: string
  validNowHeading: string
  provenConfirmed: string
  provenPending: string
  provenNotProven: string
  validCurrent: string
  validUnconfirmed: string
  validRevoked: string
  asOf: string
  splitNote: string
  unknown: string
}

export const DEFAULT_PROOF_STATUS_LABELS: ProofStatusLabels = {
  provenNowHeading: 'Proven then',
  validNowHeading: 'Valid now',
  provenConfirmed: 'Anchored to Bitcoin · block {block}',
  provenPending: 'Recorded, not yet anchored',
  provenNotProven: 'Not proven',
  validCurrent: 'Current as of {checked}',
  validUnconfirmed: 'Unconfirmed as of {checked} — check the live registry',
  validRevoked: 'Revoked / expired',
  asOf: 'as of {checked}',
  splitNote:
    'The proof never expires — it only ever says when this existed. Whether it is still valid today is a separate, live check, and MotoPass never merges the two.',
  unknown: 'not checked yet',
}

/** What the live registry says RIGHT NOW. Anything unknown stays unconfirmed. */
export type LiveValidity = 'current' | 'unconfirmed' | 'revoked'

export interface ProofStatusBadgeProps {
  /** A resolved /api/verify response (the "proven then" half). */
  verdict?: ChainVerdict | null
  /** Live validity, when (and only when) a live registry check happened. */
  live?: LiveValidity
  /** ISO timestamp of the live check — required for any dated claim. */
  checkedAt?: string | null
  labels?: Partial<ProofStatusLabels>
  className?: string
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')
}

function prettyTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
}

export function ProofStatusBadge({
  verdict = null,
  live = 'unconfirmed',
  checkedAt = null,
  labels = {},
  className = '',
}: ProofStatusBadgeProps) {
  const t = { ...DEFAULT_PROOF_STATUS_LABELS, ...labels }
  const proofState = stateFromVerdict(verdict ?? null)
  const checked = prettyTime(checkedAt)

  const proofText =
    proofState === 'confirmed'
      ? fill(t.provenConfirmed, { block: Number(verdict?.bitcoin_block_height ?? 0).toLocaleString() })
      : proofState === 'not-proven'
        ? t.provenNotProven
        : t.provenPending
  const proofAccent =
    proofState === 'confirmed'
      ? 'var(--accent-success, #15803D)'
      : proofState === 'not-proven'
        ? 'var(--accent-alert, #c2410c)'
        : 'var(--accent-gold, #B8893A)'

  // A dated validity claim needs a date. No check -> "not checked yet", never green.
  const validityKnown = live === 'current' || live === 'revoked'
  const liveText =
    live === 'current' && checked
      ? fill(t.validCurrent, { checked })
      : live === 'revoked'
        ? t.validRevoked
        : checked
          ? fill(t.validUnconfirmed, { checked })
          : t.unknown
  const liveAccent =
    live === 'current' && checked
      ? 'var(--accent-success, #15803D)'
      : live === 'revoked'
        ? 'var(--accent-alert, #c2410c)'
        : 'var(--mp-accent-ochre, #B5651D)'

  return (
    <div
      data-testid="proof-status-badge"
      data-proof-state={proofState}
      data-validity={live}
      className={`rounded-2xl border p-3 sm:p-4 ${className}`}
      style={{ borderColor: 'var(--border)', background: 'var(--mp-surface-card)' }}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <span
            className="text-[10px] font-black tracking-widest uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.provenNowHeading}
          </span>
          <span
            role="status"
            data-testid="proof-status-proven"
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wider uppercase"
            style={{ borderColor: proofAccent, color: proofAccent }}
          >
            {proofText}
          </span>
        </span>

        <span aria-hidden="true" className="text-[10px] opacity-40" style={{ color: 'var(--text-secondary)' }}>
          ≠
        </span>

        <span className="inline-flex flex-wrap items-center gap-1.5">
          <span
            className="text-[10px] font-black tracking-widest uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.validNowHeading}
          </span>
          <span
            role="status"
            data-testid="proof-status-validity"
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wider uppercase"
            style={{ borderColor: liveAccent, color: liveAccent }}
          >
            {liveText}
          </span>
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {t.splitNote}
      </p>

      {!validityKnown ? (
        <p className="sr-only">Live registry status has not been confirmed for this record.</p>
      ) : null}
    </div>
  )
}

export default ProofStatusBadge
