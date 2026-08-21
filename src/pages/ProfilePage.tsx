import { Link, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { FileUpload, type UploadItem } from '../components/beui/FileUpload'
import { satohashStampGuideUrl } from '../lib/satohash'
import {
  loadStampedDocuments,
  stampDocumentFile,
  upsertStampedDocument,
  deleteStampedDocument,
  refreshStampStatus,
  registryToProfileDocuments,
  deriveProfileStatus,
  documentVerifyUrl,
  formatBytes,
  type StampedDocument,
} from '../lib/documentStamp'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'

function statusChip(status: StampedDocument['status']): string {
  if (status === 'confirmed') return 'border-mp-proof/40 bg-mp-proof/10 text-mp-proof'
  if (status === 'pending') return 'border-status-amber/40 bg-status-amber/10 text-status-amber'
  return 'border-status-red/40 bg-status-red/10 text-status-red'
}

export function ProfilePage() {
  const { t } = useI18n()
  const { profile, isLoggedIn, setProfile } = useUser()
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [docs, setDocs] = useState<StampedDocument[]>(() => loadStampedDocuments())

  // One list: pull any Vault-stamped documents into the profile mirror on mount.
  useEffect(() => {
    if (!profile) return
    const registry = loadStampedDocuments()
    setProfile({
      ...profile,
      documents: registryToProfileDocuments(registry),
      status: deriveProfileStatus(registry, profile.status),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isLoggedIn || !profile) return <Navigate to="/register" replace />

  const syncProfile = (registry: StampedDocument[]) => {
    setProfile({
      ...profile,
      documents: registryToProfileDocuments(registry),
      status: deriveProfileStatus(registry, profile.status),
    })
  }

  const handleFileAdded = async (item: UploadItem) => {
    // Same workflow as the Vault: local SHA-256 → Satohash API stamp → poll.
    const stamped = await stampDocumentFile(item.file)
    const next = upsertStampedDocument(stamped)
    setDocs(next)
    syncProfile(next)
    setUploadItems(uploadItems.map(u => u.id === item.id ? { ...u, progress: 100, status: 'success' as const, hash: stamped.hash, satohashUrl: satohashStampGuideUrl(stamped.hash) } : u))
  }

  const handleRefresh = async (doc: StampedDocument) => {
    const updated = await refreshStampStatus(doc)
    const next = upsertStampedDocument(updated)
    setDocs(next)
    syncProfile(next)
  }

  const handleDelete = (id: string) => {
    const next = deleteStampedDocument(id)
    setDocs(next)
    syncProfile(next)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto">
      <PageHeader
        eyebrow={t('profile.eyebrow')}
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      <div className="flex gap-2 mb-6">
        <AnimatedBadge status="info">{profile.program}</AnimatedBadge>
        <AnimatedBadge status="neutral">{formatT(t, 'profile.docsCount', { count: docs.length })}</AnimatedBadge>
      </div>

      <FileUpload
        items={uploadItems}
        onItemsChange={setUploadItems}
        onFileAdded={handleFileAdded}
        title={t('upload.dropTitle')}
        description={t('upload.dropDescription')}
      />

      {docs.length > 0 && (
        <div className="mt-8 card">
          <h3 className="font-display font-semibold text-ink mb-1">{t('profile.stampedHashes')}</h3>
          <p className="font-body text-xs text-ink-muted mb-4 leading-relaxed">{t('profile.registryNote')}</p>
          <ul className="space-y-3">
            {docs.map(doc => (
              <li key={doc.id} className="text-sm border-b border-mp pb-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-ink truncate">{doc.name}</div>
                  <span className={`rounded-chip border px-2 py-0.5 text-[10px] font-mono shrink-0 ${statusChip(doc.status)}`}>
                    {doc.status === 'confirmed'
                      ? doc.blockHeight != null
                        ? `${t('vault.doc.status.confirmed')} · ${formatT(t, 'vault.doc.confirmedBlock', { block: doc.blockHeight })}`
                        : t('vault.doc.status.confirmed')
                      : doc.status === 'pending'
                        ? t('vault.doc.status.pending')
                        : t('vault.doc.status.error')}
                  </span>
                </div>
                <code className="text-[10px] text-btc-orange-deep font-mono break-all">{doc.hash}</code>
                <div className="mt-1 text-[10px] text-ink-muted font-mono">{formatBytes(doc.size)} · {doc.type || 'application/octet-stream'}</div>
                {doc.note && <p className="mt-1 text-[10px] text-status-amber">{doc.note}</p>}
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {documentVerifyUrl(doc) && (
                    <a
                      href={documentVerifyUrl(doc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-btc-orange font-medium hover:underline inline-flex items-center gap-1"
                    >
                      {t('vault.doc.verify')} <ExternalLink size={11} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleRefresh(doc)}
                    className="text-xs text-ink-muted hover:text-ink underline underline-offset-2"
                  >
                    {t('vault.doc.refresh')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="text-xs text-status-red/80 hover:text-status-red underline underline-offset-2"
                  >
                    {t('vault.doc.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link to="/dashboard" className="btn-secondary w-full mt-6 text-center block">{t('profile.backDashboard')}</Link>
    </div>
  )
}
