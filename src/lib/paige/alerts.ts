/**
 * Paige proactive alerts — reads audit_trail entries from countries.json
 * and builds structured alert objects for the in-app inbox.
 *
 * This is the client-side counterpart of the Nostr alert system (spec in
 * docs/PAIGE-PROACTIVE-ALERTS-SPEC.md). It reads the same audit trail
 * data but renders it as an in-app notification list.
 *
 * Alert types:
 *   - rule-change: official source page content changed
 *   - proof-update: program re-anchored to a new Bitcoin block
 *   - freshness-stale: program data >45 days since last research
 *   - new-pathway: new pathway added
 *   - pathway-closed: pathway removed
 */

import type { Program } from '../../types/program'

// ── Types ────────────────────────────────────────────────────────────────────

export type AlertType = 'rule-change' | 'proof-update' | 'freshness-stale' | 'new-pathway' | 'pathway-closed'

export interface PaigeAlert {
  id: string
  programName: string
  programFlag?: string
  alertType: AlertType
  summary: string
  source: string
  date: string
  proofUrl?: string
  blockHeight?: number
  /** Whether this alert is relevant to the user's portfolio */
  inPortfolio?: boolean
}

// ── Classification ───────────────────────────────────────────────────────────

interface AuditEntry {
  date?: string
  field?: string
  from?: string
  to?: string
  source?: string
  hash?: string
}

function classifyAlert(entry: AuditEntry): AlertType | null {
  const field = entry.field ?? ''
  const source = entry.source ?? ''

  // Proof re-anchor
  if (field === 'proof' || source === 'satohash-api') return 'proof-update'

  // Source probe detection
  if (field.startsWith('watch.') || source === 'source-probe') return 'rule-change'

  // Intel fetch changes
  if (source.startsWith('intel-fetch:')) {
    if (field.includes('pathways')) {
      // Check if it's a new pathway or closed pathway
      const to = entry.to ?? ''
      if (to.includes('closed') || to.includes('removed')) return 'pathway-closed'
      return 'new-pathway'
    }
    return 'rule-change'
  }

  // Field-based classification
  if (field.includes('pathways')) {
    const to = entry.to ?? ''
    if (to.includes('closed') || to.includes('removed')) return 'pathway-closed'
    return 'new-pathway'
  }

  if (field.includes('finance') || field.includes('legal_compliance') || field.includes('tax')) {
    return 'rule-change'
  }

  return null
}

function buildSummary(entry: AuditEntry, alertType: AlertType): string {
  const field = entry.field ?? 'data'
  const from = entry.from ?? ''
  const to = entry.to ?? ''

  switch (alertType) {
    case 'proof-update': {
      const block = to.match(/block\s+#?(\d+)/)?.[1]
      return block
        ? `Proof re-anchored at block #${block}`
        : 'Proof re-anchored to Bitcoin'
    }
    case 'rule-change': {
      const fieldLabel = field.replace(/^watch\./, 'Source page: ').replace(/\./g, ' ')
      if (from && to) return `${fieldLabel}: ${from.slice(0, 40)} → ${to.slice(0, 40)}`
      if (to) return `${fieldLabel}: ${to.slice(0, 60)}`
      return `Change detected in ${fieldLabel}`
    }
    case 'freshness-stale':
      return 'Data is more than 45 days old — re-research needed'
    case 'new-pathway':
      return `New pathway: ${to.slice(0, 60)}`
    case 'pathway-closed':
      return `Pathway closed: ${from.slice(0, 60)}`
  }
}

// ── Alert generation ─────────────────────────────────────────────────────────

/**
 * Build alerts from a program's audit trail.
 * Returns alerts sorted newest-first.
 */
export function buildProgramAlerts(program: Program, limit = 5): PaigeAlert[] {
  const trail = program.audit_trail ?? []
  const alerts: PaigeAlert[] = []

  for (const entry of trail) {
    const alertType = classifyAlert(entry as AuditEntry)
    if (!alertType) continue

    const alert: PaigeAlert = {
      id: `${program.id}-${alertType}-${entry.date ?? 'unknown'}`,
      programName: program.name,
      programFlag: program.flag,
      alertType,
      summary: buildSummary(entry as AuditEntry, alertType),
      source: entry.source ?? 'unknown',
      date: entry.date ?? '',
    }

    // Extract proof URL from the 'to' field if it contains a satohash URL
    const to = entry.to ?? ''
    const proofMatch = to.match(/satohash\.io\/verify\/([a-f0-9]+)/)
    if (proofMatch) {
      alert.proofUrl = `https://satohash.io/verify/${proofMatch[1]}`
    }

    // Extract block height
    const blockMatch = to.match(/block\s+#?(\d+)/)
    if (blockMatch) {
      alert.blockHeight = parseInt(blockMatch[1], 10)
    }

    alerts.push(alert)
  }

  return alerts
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, limit)
}

/**
 * Build alerts from all programs, optionally filtered to portfolio.
 * Returns alerts sorted newest-first.
 */
export function buildAllAlerts(
  programs: Program[],
  portfolioIds?: number[],
  limit = 20,
): PaigeAlert[] {
  const portfolioSet = portfolioIds ? new Set(portfolioIds) : null

  const allAlerts: PaigeAlert[] = []
  for (const program of programs) {
    const alerts = buildProgramAlerts(program, 3)
    for (const alert of alerts) {
      if (portfolioSet) {
        alert.inPortfolio = portfolioSet.has(program.id)
      }
      allAlerts.push(alert)
    }
  }

  return allAlerts
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, limit)
}

/**
 * Count alerts by type.
 */
export function countAlertsByType(alerts: PaigeAlert[]): Record<AlertType, number> {
  const counts: Record<AlertType, number> = {
    'rule-change': 0,
    'proof-update': 0,
    'freshness-stale': 0,
    'new-pathway': 0,
    'pathway-closed': 0,
  }
  for (const alert of alerts) {
    counts[alert.alertType]++
  }
  return counts
}

/**
 * Alert type metadata for UI rendering.
 */
export const ALERT_TYPE_META: Record<AlertType, { label: string; color: string; icon: string }> = {
  'rule-change': { label: 'Rule change', color: 'text-status-amber', icon: '⚡' },
  'proof-update': { label: 'Proof updated', color: 'text-mp-proof', icon: '⛓' },
  'freshness-stale': { label: 'Needs refresh', color: 'text-status-red', icon: '⏰' },
  'new-pathway': { label: 'New pathway', color: 'text-electric', icon: '➕' },
  'pathway-closed': { label: 'Pathway closed', color: 'text-status-red', icon: '➖' },
}
