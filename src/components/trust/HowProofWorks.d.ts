/**
 * Types for the ported family component.
 *
 * `HowProofWorks.jsx` is copied BYTE-FOR-BYTE from kitsboy/satohash
 * (src/components/trust/HowProofWorks.jsx, origin/main). Keeping the shipping
 * file untouched is the point — it is the family's shared artifact and every
 * offering must consume the same bytes. This declaration file gives MotoPass's
 * TypeScript imports the prop/export shapes without forking the source.
 *
 * Re-sync with:  sha256sum node_modules/.cache  ... (see docs/KIMI-HANDOFF.md)
 * Source of truth: kitsboy/satohash @ src/components/trust/HowProofWorks.jsx
 */
import type { FC, ReactNode } from 'react'

export type ProofState = 'pending' | 'confirmed' | 'not-proven'

export declare const DEFAULT_LABELS: Record<string, string>

/** Derive the honest state from a verify response. Never softens a failure. */
export declare function stateFromVerdict(verdict: object | null | undefined): ProofState

export interface HowProofWorksProps {
  /** A resolved /api/verify response — the preferred source of truth. */
  verdict?: object | null
  /** Explicit state when there is no verdict at all. */
  state?: ProofState | null
  /** The sha256 being discussed. */
  hash?: string | null
  /** Download link for the .ots proof (falls back to verdict.ots_download_url). */
  otsUrl?: string | null
  variant?: 'full' | 'compact'
  /** Override any string in DEFAULT_LABELS. */
  labels?: Record<string, string>
  className?: string
  children?: ReactNode
}

declare const HowProofWorks: FC<HowProofWorksProps>
export default HowProofWorks
