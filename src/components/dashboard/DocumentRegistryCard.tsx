import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, ExternalLink, FilePlus2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import {
  loadStampedDocuments,
  refreshStampStatus,
  restampHash,
  upsertStampedDocument,
  registryToProfileDocuments,
  deriveProfileStatus,
  documentVerifyUrl,
  formatBytes,
  type StampedDocument,
} from '../../lib/documentStamp'
import { downloadDocumentRegistry } from '../../lib/documentRegistryExport'

function statusChip(status: StampedDocument['status']): string {
  if (status === 'confirmed') return 'border-mp-proof/40 bg-mp-proof/10 text-mp-proof'
  if (status === 'pending') return 'border-status-amber/40 bg-status-amber/10 text-status-amber'
  return 'border-status-red/40 bg-status-red/10 text-status-red'
}

export function DocumentRegistryCard() {
  const { t } = useI18n()
  const { profile, setProfile } = useUser()
  const [docs, setDocs] = useState<StampedDocument[]>(() => loadStampedDocuments())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [recheckingAll, setRecheckingAll] = useState(false)

  const syncProfile = (registry: StampedDocument[]) => {
    if (!profile) return
    setProfile({
      ...profile,
      documents: registryToProfileDocuments(registry),
      status: deriveProfileStatus(registry, profile.status),
    })
  }

  const handleRecheck = async (doc: StampedDocument) => {
    setBusyId(doc.id)
    try {
      const updated = await refreshStampStatus(doc)
      const next = upsertStampedDocument(updated)
      setDocs(next)
      syncProfile(next)
    } finally {
      setBusyId(null)
    }
  }

  const handleRestamp = async (doc: StampedDocument) => {
    setBusyId(doc.id)
    try {
      const updated = await restampHash(doc)
      const next = upsertStampedDocument(updated)
      setDocs(next)
      syncProfile(next)
    } finally {
      setBusyId(null)
    }
  }

  const handleRecheckAll = async () => {
    if (recheckingAll) return
    setRecheckingAll(true)
    try {
      let next = loadStampedDocuments()
      for (const doc of next.filter(d => d.stampId)) {
        const updated = await refreshStampStatus(doc)
        next = upsertStampedDocument(updated)
        setDocs([...next])
      }
      syncProfile(next)
    } finally {
      setRecheckingAll(false)
    }
  }

  const confirmable = docs.some(d => d.status === 'confirmed')

  return (
    <div className="card mb-8">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <ShieldCheck size={16} className="text-mp-proof shrink-0" aria-hidden />
            {t('dashboard.registryTitle')}
          </h2>
          <p className="font-body text-xs text-ink-muted mt-1 leading-relaxed">{t('dashboard.registrySub')}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link to="/profile" className="chip text-xs inline-flex items-center gap-1 hover:border-mp-proof/40">
            <FilePlus2 size={12} aria-hidden />
            {t('dashboard.registryAdd')}
          </Link>
          <button
            type="button"
            onClick={() => downloadDocumentRegistry(docs)}
            disabled={docs.length === 0}
            className="chip text-xs inline-flex items-center gap-1 disabled:opacity-55 disabled:cursor-not-allowed"
          >
            <Download size={12} aria-hidden />
            {t('dashboard.registryExport')}
          </button>
          {docs.length > 0 && (
            <button
              type="button"
              onClick={() => void handleRecheckAll()}
              disabled={recheckingAll}
              className="chip text-xs inline-flex items-center gap-1 disabled:opacity-55"
            >
              <RefreshCw size={12} className={recheckingAll ? 'animate-spin' : ''} aria-hidden />
              {t('dashboard.registryRecheckAll')}
            </button>
          )}
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-mp-md border border-mp/60 bg-card-muted/40 px-3 py-3">
          <p className="text-xs text-ink-muted font-chrome">{t('dashboard.registryEmpty')}</p>
          <Link to="/profile" className="text-xs text-mp-proof hover:underline mt-1 inline-block">
            {t('dashboard.registryEmptyCta')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map(doc => {
            const busy = busyId === doc.id
            const verifyUrl = documentVerifyUrl(doc)
            const canRecheck = !!doc.stampId && doc.status !== 'error'
            const canRestamp = doc.status === 'error' || !doc.stampId
            return (
              <li key={doc.id} className="rounded-mp-md border border-mp/60 bg-card-muted/40 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-chrome text-ink">{doc.name}</p>
                    <p className="truncate font-mono text-[10px] text-ink-muted">{doc.hash.slice(0, 20)}… · {formatBytes(doc.size)}</p>
                  </div>
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
                {doc.note && <p className="mt-1 text-[10px] text-status-amber">{doc.note}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {verifyUrl && (
                    <a
                      href={verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-mp-proof hover:underline"
                    >
                      {t('vault.doc.verify')} <ExternalLink size={10} aria-hidden />
                    </a>
                  )}
                  {canRecheck && (
                    <button
                      type="button"
                      onClick={() => void handleRecheck(doc)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 text-[10px] text-ink-muted hover:text-ink underline underline-offset-2 disabled:opacity-55"
                    >
                      <RefreshCw size={10} className={busy ? 'animate-spin' : ''} aria-hidden />
                      {t('vault.doc.refresh')}
                    </button>
                  )}
                  {canRestamp && (
                    <button
                      type="button"
                      onClick={() => void handleRestamp(doc)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 text-[10px] text-btc-orange hover:text-btc-orange-deep underline underline-offset-2 disabled:opacity-55"
                    >
                      {t('dashboard.registryRetryStamp')}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-mono text-ink-muted">
          {formatT(t, 'dashboard.registryCount', { count: docs.length })} ·{' '}
          {formatT(t, 'dashboard.registryConfirmed', { count: docs.filter(d => d.status === 'confirmed').length })}
        </p>
        <Link to="/vault" className="text-[10px] font-chrome text-mp-btc-text hover:underline">
          {t('dashboard.registryVaultLink')} →
        </Link>
      </div>
      {confirmable && (
        <p className="mt-2 text-[10px] text-mp-proof/80 font-mono">
          {t('dashboard.registryAttachHint')}
        </p>
      )}
    </div>
  )
}
