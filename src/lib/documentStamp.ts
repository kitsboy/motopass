import { stampHash, pollStamp, getStamp, satohashVerifyUrl, satohashStampGuideUrl } from './satohash'
import type { ApplicationStatus, UserDocument } from '../types/user'

/**
 * Vault document-stamping registry.
 *
 * Workflow: a file is SHA-256 hashed LOCALLY (the file never leaves the
 * device), the hash is submitted to the Satohash API for OpenTimestamps
 * anchoring, and the stamp is polled for Bitcoin confirmation. Only metadata
 * + hash are persisted (localStorage) — never the file.
 *
 * Honest statuses only:
 *   - pending   → submitted to the Satohash API, awaiting Bitcoin block
 *   - confirmed → anchor seen (bitcoin_block_height from the API)
 *   - error     → submission or polling failed; retry available
 */

export type DocStampStatus = 'pending' | 'confirmed' | 'error'

export interface StampedDocument {
  /** Local registry id (not the Satohash stamp id). */
  id: string
  name: string
  size: number
  type: string
  /** SHA-256 of the raw file bytes — the on-chain anchor. */
  hash: string
  /** Satohash API stamp id (uuid) once submitted. */
  stampId?: string
  status: DocStampStatus
  blockHeight?: number | null
  createdAt: string
  updatedAt: string
  note?: string
}

const STORAGE_KEY = 'motopass-vault-documents'

export function loadStampedDocuments(): StampedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StampedDocument[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStampedDocuments(docs: StampedDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  } catch {
    /* storage full or unavailable — registry is best-effort */
  }
}

export function deleteStampedDocument(id: string): StampedDocument[] {
  const next = loadStampedDocuments().filter(d => d.id !== id)
  saveStampedDocuments(next)
  return next
}

/** Replace an existing registry entry (by id) or prepend a new one — newest first. */
export function upsertStampedDocument(doc: StampedDocument): StampedDocument[] {
  const all = loadStampedDocuments()
  const idx = all.findIndex(d => d.id === doc.id)
  const next = idx >= 0 ? all.map(d => (d.id === doc.id ? doc : d)) : [doc, ...all]
  saveStampedDocuments(next)
  return next
}

/**
 * Mirror the shared registry into UserDocument[] for the profile.
 * Confirmed anchors map to the semantic 'stamped' status; pending/error
 * pass through honestly. Names are display-only — never hashed on-chain.
 */
export function registryToProfileDocuments(registry: StampedDocument[]): UserDocument[] {
  return registry.map(d => ({
    id: d.id,
    name: d.name,
    size: d.size,
    type: d.type,
    hash: d.hash,
    satohashUrl: documentVerifyUrl(d) ?? satohashStampGuideUrl(d.hash),
    stampedAt: d.updatedAt,
    status: d.status === 'confirmed' ? 'stamped' : d.status,
  }))
}

/** Honest profile status from the registry — never downgrades a progressed profile. */
export function deriveProfileStatus(registry: StampedDocument[], current: ApplicationStatus): ApplicationStatus {
  if (registry.some(d => d.status === 'confirmed')) return 'stamped'
  if (registry.length > 0 && current === 'registered') return 'documents'
  return current
}

/** Pure status mapping — testable without the API. */
export function deriveDocStatus(
  apiStatus?: string,
  blockHeight?: number | null,
): DocStampStatus {
  if (blockHeight != null) return 'confirmed'
  const s = (apiStatus ?? '').toLowerCase()
  if (['confirmed', 'anchored', 'complete', 'completed'].includes(s)) return 'confirmed'
  if (['failed', 'error', 'rejected'].includes(s)) return 'error'
  return 'pending'
}

function localId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** SHA-256 of raw file bytes — the honest anchor (file never leaves device). */
export async function sha256File(file: File | Blob): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Stamp a file: hash locally → POST /api/stamp → light poll for the anchor.
 * Returns a registry entry; never throws for API failures — surfaces them as
 * status 'error' with a note (user can retry or use the deep-link).
 */
export async function stampDocumentFile(
  file: File,
): Promise<StampedDocument> {
  const createdAt = new Date().toISOString()
  const base: StampedDocument = {
    id: localId(),
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    hash: '',
    status: 'pending',
    createdAt,
    updatedAt: createdAt,
  }

  try {
    const hash = await sha256File(file)
    base.hash = hash
  } catch {
    return { ...base, status: 'error', note: 'Local hashing failed — file not sent anywhere.' }
  }

  const submitted = await stampHash(base.hash, { filename: `motopass-doc-${file.name}` })
  if (!submitted.ok || !submitted.id) {
    return {
      ...base,
      status: 'error',
      note: submitted.error ?? 'Satohash API unreachable — use the Satohash stamp guide link.',
    }
  }

  base.stampId = submitted.id

  // Light poll: wait for the Bitcoin anchor (non-fatal on timeout).
  const polled = await pollStamp(submitted.id, { attempts: 3, intervalMs: 2000 })
  base.blockHeight = polled.ok ? polled.bitcoin_block_height ?? null : null
  base.status = deriveDocStatus(polled.ok ? polled.status : undefined, base.blockHeight)
  base.updatedAt = new Date().toISOString()
  return base
}

/** Re-check a stored document's anchor on the Satohash API. */
export async function refreshStampStatus(doc: StampedDocument): Promise<StampedDocument> {
  if (!doc.stampId) return { ...doc, status: 'error', note: 'No Satohash stamp id on file.' }
  const result = await getStamp(doc.stampId)
  if (!result.ok) {
    return { ...doc, status: 'error', note: result.error ?? 'Satohash API unreachable' }
  }
  const blockHeight = result.bitcoin_block_height ?? doc.blockHeight ?? null
  return {
    ...doc,
    blockHeight,
    status: deriveDocStatus(result.status, blockHeight),
    updatedAt: new Date().toISOString(),
    note: undefined,
  }
}

/**
 * Re-submit a stored content hash to the Satohash API — the "stamp" quick
 * action for entries whose first attempt failed or never anchored. The file
 * is never needed again: only the already-local hash leaves the device.
 */
export async function restampHash(doc: StampedDocument): Promise<StampedDocument> {
  if (!doc.hash) {
    return { ...doc, status: 'error', note: 'No content hash on file to restamp.' }
  }
  const submitted = await stampHash(doc.hash, { filename: `motopass-doc-${doc.name}` })
  if (!submitted.ok || !submitted.id) {
    return {
      ...doc,
      status: 'error',
      note: submitted.error ?? 'Satohash API unreachable — retry later or use the stamp guide.',
    }
  }
  const base: StampedDocument = {
    ...doc,
    stampId: submitted.id,
    status: 'pending',
    note: undefined,
    updatedAt: new Date().toISOString(),
  }
  const polled = await pollStamp(submitted.id, { attempts: 3, intervalMs: 2000 })
  const blockHeight = polled.ok ? polled.bitcoin_block_height ?? null : null
  return {
    ...base,
    blockHeight,
    status: deriveDocStatus(polled.ok ? polled.status : undefined, blockHeight),
    updatedAt: new Date().toISOString(),
  }
}

/** Allowlisted Satohash verify URL for a document's content hash. */
export function documentVerifyUrl(doc: StampedDocument): string | undefined {
  if (!doc.hash) return undefined
  return satohashVerifyUrl(doc.hash) || undefined
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
