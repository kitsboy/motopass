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

/**
 * Recursive stable stringify — sorts object keys at every level so the hash is
 * deterministic regardless of source key order.
 *
 * NOTE (2026-08-20 fix): the previous implementation used
 * `JSON.stringify(slice, Object.keys(slice).sort())`. An array replacer is
 * applied at EVERY nesting level, so all nested objects (finance, pathways,
 * legal_compliance, ...) serialized as empty `{}` — proofs never covered the
 * actual researched content. This function is the honest replacement.
 */
export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** Deterministic canonical JSON for a program (stable key order, all depths). */
export function canonicalSlice(program) {
  const slice = {}
  for (const field of SLICE_FIELDS) {
    if (field in program) slice[field] = program[field]
  }
  return stableStringify(slice)
}

/** sha256 hex of the canonical slice. */
export function canonicalSliceHash(program) {
  return createHash('sha256').update(canonicalSlice(program)).digest('hex')
}
