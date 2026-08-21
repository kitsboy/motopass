import { BUILD_ID, BUILD_LABEL } from './buildInfo'
import { documentVerifyUrl, type StampedDocument } from './documentStamp'

/**
 * Portable JSON backup of the shared document registry.
 *
 * Every entry carries its raw SHA-256 (the on-chain anchor), the Satohash
 * stamp id, and an allowlisted verify URL — so the backup can be audited
 * against Bitcoin without MotoPass. Names are included for the owner's
 * identification only; they were never part of any hashed payload.
 */
export type DocumentRegistryBundle = {
  schema: 'motopass-document-registry/v1'
  build: string
  build_label: string
  exported_at: string
  issuer: 'MotoPass document registry'
  documents: {
    id: string
    name: string
    size: number
    type: string
    hash: string
    stamp_id?: string
    status: 'pending' | 'confirmed' | 'error'
    block_height?: number | null
    created_at: string
    updated_at: string
    note?: string
    verify_url: string
  }[]
}

export function buildDocumentRegistryBundle(docs: StampedDocument[]): DocumentRegistryBundle {
  return {
    schema: 'motopass-document-registry/v1',
    build: BUILD_ID,
    build_label: BUILD_LABEL,
    exported_at: new Date().toISOString(),
    issuer: 'MotoPass document registry',
    documents: docs.map(d => ({
      id: d.id,
      name: d.name,
      size: d.size,
      type: d.type,
      hash: d.hash,
      stamp_id: d.stampId,
      status: d.status,
      block_height: d.blockHeight ?? null,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
      note: d.note,
      verify_url: documentVerifyUrl(d) ?? '',
    })),
  }
}

export function documentRegistryBackupJson(docs: StampedDocument[]): string {
  return JSON.stringify(buildDocumentRegistryBundle(docs), null, 2)
}

export function downloadDocumentRegistry(docs: StampedDocument[]): void {
  const blob = new Blob([documentRegistryBackupJson(docs)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `motopass-documents-${BUILD_ID}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export type RegistryImportResult =
  | { ok: true; docs: StampedDocument[]; imported: number; skipped: number }
  | { ok: false; error: string }

function isDocStatus(s: unknown): s is StampedDocument['status'] {
  return s === 'pending' || s === 'confirmed' || s === 'error'
}

/**
 * Parse + validate a registry backup. Only entries with a 64-hex SHA-256
 * are imported; the hash is the honest anchor and everything else is
 * metadata. Recorded statuses are preserved as the backup's claim — the
 * UI offers re-check to confirm anchors against the API.
 */
export function parseDocumentRegistryBackup(json: string): RegistryImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Not valid JSON' }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Not a document registry backup' }
  }
  const bundle = raw as Partial<DocumentRegistryBundle>
  if (bundle.schema !== 'motopass-document-registry/v1') {
    return { ok: false, error: `Unsupported schema: ${String(bundle.schema ?? 'missing')}` }
  }
  if (!Array.isArray(bundle.documents)) {
    return { ok: false, error: 'Backup has no documents array' }
  }

  const docs: StampedDocument[] = []
  let skipped = 0
  const now = new Date().toISOString()
  for (const rawDoc of bundle.documents) {
    const d = rawDoc as Partial<DocumentRegistryBundle['documents'][number]>
    const hash = typeof d.hash === 'string' ? d.hash.trim().toLowerCase() : ''
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      skipped++
      continue
    }
    docs.push({
      id: typeof d.id === 'string' && d.id ? d.id : `restored-${hash.slice(0, 12)}`,
      name: typeof d.name === 'string' && d.name ? d.name : `restored-${hash.slice(0, 8)}`,
      size: typeof d.size === 'number' && d.size >= 0 ? d.size : 0,
      type: typeof d.type === 'string' && d.type ? d.type : 'application/octet-stream',
      hash,
      stampId: typeof d.stamp_id === 'string' ? d.stamp_id : undefined,
      status: isDocStatus(d.status) ? d.status : 'pending',
      blockHeight: typeof d.block_height === 'number' ? d.block_height : null,
      createdAt: typeof d.created_at === 'string' ? d.created_at : now,
      updatedAt: typeof d.updated_at === 'string' ? d.updated_at : now,
      note: typeof d.note === 'string' && d.note ? d.note : undefined,
    })
  }

  if (docs.length === 0) {
    return { ok: false, error: 'No valid documents found in the backup' }
  }
  return { ok: true, docs, imported: docs.length, skipped }
}

/**
 * Merge a backup into the current registry: same-id entries keep the newer
 * updatedAt, new entries are added, result sorted newest-first.
 */
export function mergeRegistryBackup(current: StampedDocument[], incoming: StampedDocument[]): StampedDocument[] {
  const byId = new Map<string, StampedDocument>()
  for (const d of current) byId.set(d.id, d)
  for (const d of incoming) {
    const existing = byId.get(d.id)
    if (!existing || (d.updatedAt ?? '') > (existing.updatedAt ?? '')) {
      byId.set(d.id, d)
    }
  }
  return Array.from(byId.values()).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}
