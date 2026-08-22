import { BadgeCheck, ExternalLink, Clock } from 'lucide-react'
import type { CountryTrustEnvelope } from '../../types/countryTrust'

/**
 * ProofBadge — "✓ Bitcoin-anchored" chip.
 * Interactive: hover shows block/hash detail, click opens the real satohash
 * verify URL (or the local .ots file) in a new tab. The hash and URL are the
 * REAL values from the envelope — never a placeholder.
 */
export function ProofBadge({ proof }: { proof: CountryTrustEnvelope['proof'] }) {
  const confirmed = proof.status === 'confirmed'
  const hashShort = proof.hash ? `${proof.hash.slice(0, 10)}…${proof.hash.slice(-6)}` : null

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {confirmed && proof.proof_url ? (
        <a
          href={proof.proof_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 rounded-chip border border-mp-proof/35 bg-mp-proof-soft px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-mp-proof transition-colors duration-fast hover:border-mp-proof/60 hover:shadow-[0_0_14px_rgba(74,222,128,0.18)]"
          title={`Verify on Satohash — sha256 ${proof.hash ?? ''}`}
        >
          <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Bitcoin-anchored</span>
          <ExternalLink
            className="h-2.5 w-2.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </a>
      ) : confirmed ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-chip border border-mp-proof/35 bg-mp-proof-soft px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-mp-proof"
          title={proof.ots_path ?? 'Proof on file'}
        >
          <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Bitcoin-anchored</span>
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1.5 rounded-chip border border-mp-ochre/40 bg-mp-btc-soft px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-mp-btc-text"
          title="Proof not yet stamped into a Bitcoin block."
        >
          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Proof pending</span>
        </span>
      )}

      {confirmed && (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-mp-ink-tertiary">
          <span>block {proof.block ?? '—'}</span>
          {hashShort && (
            <span className="hidden sm:inline" title={`sha256 ${proof.hash}`}>
              · {hashShort}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
