import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Check, FileUp, Loader2, RefreshCw, Trash2, ExternalLink, Fingerprint } from 'lucide-react'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import {
  loadStampedDocuments,
  saveStampedDocuments,
  deleteStampedDocument,
  stampDocumentFile,
  refreshStampStatus,
  documentVerifyUrl,
  formatBytes,
  type StampedDocument,
} from '../../lib/documentStamp'
import { safeSatohashHref } from '../../lib/satohash'

type BusyState = { id: string; label: string } | null

const STATUS_BADGE: Record<StampedDocument['status'], string> = {
  pending: 'border-mp-ochre/50 bg-mp-btc-soft text-mp-btc-text',
  confirmed: 'border-mp-proof/40 bg-mp-proof/10 text-mp-proof',
  error: 'border-status-red/40 bg-status-red/10 text-status-red',
}

/**
 * Stamp any document on Bitcoin — files are hashed locally, only the SHA-256
 * is sent to the Satohash API, and the registry lives on this device.
 */
export function DocumentStamper() {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<StampedDocument[]>(() => loadStampedDocuments())
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState<BusyState>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    saveStampedDocuments(docs)
  }, [docs])

  const addFile = useCallback(
    async (file: File) => {
      if (!file || busy) return
      setBusy({ id: 'new', label: file.name })
      const entry = await stampDocumentFile(file)
      setDocs(prev => [entry, ...prev])
      setBusy(null)
    },
    [busy],
  )

  const handleRefresh = async (doc: StampedDocument) => {
    setBusy({ id: doc.id, label: doc.name })
    const updated = await refreshStampStatus(doc)
    setDocs(prev => prev.map(d => (d.id === doc.id ? updated : d)))
    setBusy(null)
  }

  const handleDelete = (id: string) => {
    setDocs(deleteStampedDocument(id))
  }

  const copyHash = async (doc: StampedDocument) => {
    await navigator.clipboard.writeText(doc.hash)
    setCopiedId(doc.id)
    window.setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Card id="vault-stamp" variant="proof" animate className="mb-8 scroll-mt-header" aria-labelledby="vault-stamp-heading">
      <h2 id="vault-stamp-heading" className="font-chrome text-sm font-semibold text-ink flex items-center gap-2 mb-3">
        <Fingerprint size={16} className="text-btc-orange" aria-hidden />
        {t('vault.doc.title')}
      </h2>
      <p className="font-body text-xs text-ink-muted mb-4 leading-relaxed">{t('vault.doc.subtitle')}</p>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        multiple
        onChange={e => {
          const files = e.target.files ? [...e.target.files] : []
          void files.reduce(
            (chain, f) => chain.then(() => (busy ? Promise.resolve() : addFile(f))),
            Promise.resolve(),
          )
          e.target.value = ''
        }}
      />
      <button
        type="button"
        aria-label={t('vault.doc.pick')}
        disabled={!!busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          if (!busy) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) void addFile(f)
        }}
        className={`w-full rounded-mp-lg border-2 border-dashed p-5 text-center transition-all bg-card-muted/30 ${
          dragging ? 'border-btc-orange bg-btc-orange-soft/60' : 'border-mp/70 hover:border-btc-orange/40 hover:bg-section/40'
        } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {busy ? (
          <Loader2 size={24} className="mx-auto mb-2 text-btc-orange animate-spin" aria-hidden />
        ) : (
          <FileUp size={24} className="mx-auto mb-2 text-btc-orange" aria-hidden />
        )}
        <div className="font-chrome text-xs font-semibold text-ink">{t('vault.doc.dropTitle')}</div>
        <div className="text-[10px] text-ink-muted mt-1">{t('vault.doc.dropDescription')}</div>
      </button>
      {busy && (
        <p className="mt-2 text-xs font-mono text-ink-muted truncate" role="status">
          <Loader2 size={11} className="inline animate-spin mr-1" aria-hidden />
          {t('vault.doc.stamping')} {busy.label}
        </p>
      )}

      {docs.length > 0 && (
        <ul className="mt-5 space-y-2.5">
          {docs.map(doc => {
            const verifyHref = documentVerifyUrl(doc) && safeSatohashHref(documentVerifyUrl(doc))
            return (
              <li
                key={doc.id}
                className="rounded-mp-md border border-mp/50 bg-card-muted/30 p-3 backdrop-blur-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-chrome text-xs font-semibold text-ink">{doc.name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-muted">{formatBytes(doc.size)}</span>
                    <span
                      className={`shrink-0 rounded-chip border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${STATUS_BADGE[doc.status]}`}
                    >
                      {doc.status === 'confirmed' && doc.blockHeight != null
                        ? formatT(t, 'vault.doc.confirmedBlock', { block: doc.blockHeight })
                        : t(`vault.doc.status.${doc.status}`)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => void handleRefresh(doc)} className="chip !px-2 !py-1" title={t('vault.doc.refresh')} aria-label={t('vault.doc.refresh')} disabled={busy?.id === doc.id}>
                      {busy?.id === doc.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                    </button>
                    <button type="button" onClick={() => void copyHash(doc)} className="chip !px-2 !py-1" title={t('vault.doc.copyHash')} aria-label={t('vault.doc.copyHash')}>
                      {copiedId === doc.id ? <Check size={11} className="text-status-green" /> : <Copy size={11} />}
                    </button>
                    {verifyHref && (
                      <a href={verifyHref} target="_blank" rel="noopener noreferrer" className="chip !px-2 !py-1 text-mp-btc-text" title={t('vault.doc.verify')}>
                        <ExternalLink size={11} />
                      </a>
                    )}
                    <button type="button" onClick={() => handleDelete(doc.id)} className="chip !px-2 !py-1 hover:!text-status-red" title={t('vault.doc.delete')} aria-label={t('vault.doc.delete')}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate font-mono text-[10px] text-ink-secondary">{doc.hash}</code>
                  {doc.stampId && (
                    <span className="shrink-0 font-mono text-[9px] text-ink-muted">stamp {doc.stampId.slice(0, 12)}…</span>
                  )}
                </div>
                {doc.note && <p className="mt-1 text-[10px] text-status-amber">{doc.note}</p>}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-ink-muted">{t('vault.doc.privacyNote')}</p>
    </Card>
  )
}
