import { getEventHash, verifyEvent, type Event } from 'nostr-tools'
import { hasNostrExtension } from './nostr'
import { publishEvent, relayStatusSummary, type PublishResult } from './nostrRelay'
import { signedEventMatchesTemplate } from './timestampSecurity'
import type { AuditEntry } from '../types/program'
import type { Program } from '../components/programs/types'

/**
 * The audit trail as a public NOSTR ledger.
 *
 * Each audit row becomes a kind-30078 event whose `created_at` is the row's own
 * date, not the moment it was published — a ledger entry that claims "this
 * changed on 2026-11-09" must not be stamped with today's clock. A row without
 * a valid date is skipped rather than given one.
 *
 * Publishing signs with the visitor's NIP-07 key, not a MotoPass key. That is
 * deliberate and stated in the UI: MotoPass has no signing authority here, so
 * the event proves who republished the record, and the source link proves what
 * it says.
 */

export interface AuditLedgerEvent {
  kind: 30078
  created_at: number
  tags: string[][]
  content: string
}

export type LedgerPublishStatus = 'published' | 'signed-unpublished' | 'unsigned' | 'rejected' | 'empty'

export interface LedgerPublishResult {
  status: LedgerPublishStatus
  events: AuditLedgerEvent[]
  json: string
  signedCount: number
  publishedCount: number
  relaySummary?: string
  error?: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const SHA256_HEX = /^[a-f0-9]{64}$/i

function clean(value: string | undefined | null, max: number): string | null {
  if (!value) return null
  let out = ''
  for (const ch of value) {
    const code = ch.charCodeAt(0)
    if (code < 32 || code === 127) continue
    out += ch
  }
  const trimmed = out.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

function httpUrl(value: string | undefined | null): string | null {
  if (!value) return null
  const match = value.match(/https?:\/\/[^\s)]+/i)
  if (!match) return null
  try {
    const url = new URL(match[0].replace(/[.,;]+$/, ''))
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Row date at noon UTC — stable across timezones, never "now". */
export function ledgerCreatedAt(date: string): number | null {
  if (!DATE_RE.test(date.trim())) return null
  const parsed = Date.parse(`${date.trim()}T12:00:00Z`)
  if (!Number.isFinite(parsed)) return null
  return Math.floor(parsed / 1000)
}

export function programSlug(program: Pick<Program, 'id' | 'countryCode' | 'country'>): string {
  const raw = program.countryCode?.trim() || program.country || program.id
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function dTag(program: Pick<Program, 'id' | 'countryCode' | 'country'>, row: AuditEntry, index: number): string {
  const field = clean(row.field, 64)?.toLowerCase().replace(/[^a-z0-9._-]+/g, '-') ?? 'unknown'
  const date = clean(row.date, 10) ?? 'undated'
  return `motopass-audit-${programSlug(program)}-${date}-${field}-${index}`.slice(0, 240)
}

/** One deterministic event per audit row. Rows without a field, target or date are skipped. */
export function buildAuditLedgerEvents(program: Program): AuditLedgerEvent[] {
  const rows = program.auditTrail ?? []
  const events: AuditLedgerEvent[] = []
  rows.forEach((row, index) => {
    const field = clean(row.field, 80)
    const to = clean(row.to, 400)
    const createdAt = ledgerCreatedAt(row.date ?? '')
    if (!field || !to || createdAt == null) return

    const from = clean(row.from, 400)
    const source = httpUrl(row.source)
    const hash = row.hash && SHA256_HEX.test(row.hash.trim()) ? row.hash.trim().toLowerCase() : null
    const country = clean(program.country, 80) ?? program.country
    const code = clean(program.countryCode, 8) ?? program.countryCode

    const tags: string[][] = [
      ['d', dTag(program, row, index)],
      ['t', 'motopass'],
      ['t', 'audit'],
      ['program', country],
      ['country', code],
      ['field', field],
      ['date', row.date],
    ]
    if (source) tags.push(['source', source])
    if (hash) tags.push(['hash', hash])

    events.push({
      kind: 30078,
      created_at: createdAt,
      tags,
      content: JSON.stringify({
        platform: 'MotoPass',
        kind: 'audit-entry',
        program: country,
        country_code: code,
        field,
        from: from ?? null,
        to,
        date: row.date,
        source,
        hash,
      }),
    })
  })
  return events
}

export function ledgerJson(events: AuditLedgerEvent[]): string {
  return JSON.stringify({ platform: 'MotoPass', kind: 'audit-ledger', events }, null, 2)
}

type SignedLike = {
  id: string
  pubkey: string
  kind: number
  created_at: number
  tags: string[][]
  content: string
  sig: string
}

function isSignedLike(value: unknown): value is SignedLike {
  if (!value || typeof value !== 'object') return false
  const e = value as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    typeof e.pubkey === 'string' &&
    typeof e.sig === 'string' &&
    typeof e.kind === 'number' &&
    typeof e.created_at === 'number' &&
    typeof e.content === 'string' &&
    Array.isArray(e.tags)
  )
}

/**
 * Sign each audit event with NIP-07 and publish it. Never throws.
 * Without an extension the caller gets the exact JSON to publish elsewhere.
 */
export async function publishAuditLedger(program: Program): Promise<LedgerPublishResult> {
  const events = buildAuditLedgerEvents(program)
  const json = ledgerJson(events)
  if (events.length === 0) {
    return { status: 'empty', events, json, signedCount: 0, publishedCount: 0 }
  }
  if (!hasNostrExtension() || !window.nostr?.signEvent) {
    return { status: 'unsigned', events, json, signedCount: 0, publishedCount: 0 }
  }

  const signed: SignedLike[] = []
  try {
    for (const template of events) {
      const result = await window.nostr.signEvent({
        kind: template.kind,
        created_at: template.created_at,
        tags: template.tags,
        content: template.content,
      })
      if (!isSignedLike(result)) {
        return {
          status: 'rejected',
          events,
          json,
          signedCount: signed.length,
          publishedCount: 0,
          error: 'NIP-07 did not return a signed event',
        }
      }
      if (!signedEventMatchesTemplate(result, template)) {
        return {
          status: 'rejected',
          events,
          json,
          signedCount: signed.length,
          publishedCount: 0,
          error: 'Signer returned a different event — publish aborted',
        }
      }
      if (result.id !== getEventHash(result as unknown as Event) || !verifyEvent(result as unknown as Event)) {
        return {
          status: 'rejected',
          events,
          json,
          signedCount: signed.length,
          publishedCount: 0,
          error: 'Signature failed verification',
        }
      }
      signed.push(result)
    }
  } catch (err) {
    return {
      status: 'rejected',
      events,
      json,
      signedCount: signed.length,
      publishedCount: 0,
      error: err instanceof Error ? err.message : 'Signing failed',
    }
  }

  const results: PublishResult[] = []
  let publishedCount = 0
  for (const event of signed) {
    const perEvent = await publishEvent(event as unknown as Event)
    results.push(...perEvent)
    if (perEvent.some(result => result.ok)) publishedCount += 1
  }

  return {
    status: publishedCount > 0 ? 'published' : 'signed-unpublished',
    events,
    json: JSON.stringify({ platform: 'MotoPass', kind: 'audit-ledger', events: signed }, null, 2),
    signedCount: signed.length,
    publishedCount,
    relaySummary: relayStatusSummary(results),
    error: publishedCount > 0 ? undefined : 'Signed locally — no relay accepted. Keep the JSON.',
  }
}
