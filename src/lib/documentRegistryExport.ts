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
