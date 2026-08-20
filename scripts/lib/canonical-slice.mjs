#!/usr/bin/env node
import { createHash } from 'node:crypto'

/**
 * Canonical program slice — the exact field set covered by Satohash/OTS proofs.
 *
 * Single source of truth shared by:
 *   - scripts/stamp-ots.mjs   (local OpenTimestamps files)
 *   - scripts/stamp-changed.mjs (Satohash API re-stamp loop)
 *
 * IMPORTANT: if this field set changes, every program's content hash changes
 * and all proofs must be re-stamped. Change deliberately; keep `last_checked`
 * (a human research date) so daily freshness sweeps never trigger re-stamps.
 */
export const SLICE_FIELDS = [
  'id',
  'name',
  'finance',
  'pathways',
  'critical_tests',
  'legal_compliance',
  'compliance_clock',
  'last_checked',
]

/** Deterministic canonical JSON for a program (stable key order). */
export function canonicalSlice(program) {
  const slice = {}
  for (const field of SLICE_FIELDS) {
    if (field in program) slice[field] = program[field]
  }
  return JSON.stringify(slice, Object.keys(slice).sort())
}

/** sha256 hex of the canonical slice. */
export function canonicalSliceHash(program) {
  return createHash('sha256').update(canonicalSlice(program)).digest('hex')
}
