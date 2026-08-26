import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExternalLink, Shield, Copy, Check, ClipboardPaste, History, RotateCcw, QrCode, Download, FileUp, Loader2 } from 'lucide-react'
import {
  hashApplicationPayload,
  satohashStampGuideUrl,
  satohashVerifyUrl,
  satohashProofVerifyUrl,
  stampHash,
  getApiHealth,
  pollStamp,
} from '../lib/satohash'
import { buildTimestampAttestationEvent } from '../lib/nostrEvents'
import { announceTimestampOnNostr, type TimestampPublishResult } from '../lib/nostrTimestamp'
import { buildPageVerifyPayload } from '../lib/pageVerify'
import { parseHashLines, verifyHashPaste } from '../lib/seal/vaultVerify'
import { verifyOtsPasteContent } from '../lib/verifyOtsPaste'
import { loadHashHistory, pushHashHistory } from '../lib/verifyHashHistory'
import { BlockHeight } from '../components/BlockHeight'
import { VerifyResultsExplainer } from '../components/verify/VerifyResultsExplainer'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'
import { useToast } from '../components/ui/Toast'
import { formatT } from '../i18n/format'
import type { VerifyResult } from '../types/proof'

type StampUiState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | {
      kind: 'api'
      id: string
      status?: string
      verifyUrl: string
      blockHeight?: number | null
      confirmedAt?: string | null
    }
  | { kind: 'fallback'; guideUrl: string; error?: string }

type ApiHealthUi = 'checking' | 'online' | 'offline'

export function VerifyPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState(() => {
    const path = searchParams.get('path')
    const build = searchParams.get('build')
    if (path && build) {
      return JSON.stringify(buildPageVerifyPayload(path, build), null, 2)
    }
    return 'MotoPass — Truth You Can Verify'
  })
  const [hash, setHash] = useState(() => searchParams.get('hash') ?? '')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState(() => loadHashHistory())
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState<VerifyResult[]>([])
  const [batchBusy, setBatchBusy] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchCopied, setBatchCopied] = useState(false)
  const [otsPaste, setOtsPaste] = useState('')
  const [otsHash, setOtsHash] = useState('')
  const [otsResult, setOtsResult] = useState<VerifyResult | null>(null)
  const [stampUi, setStampUi] = useState<StampUiState>({ kind: 'idle' })
  const [apiHealth, setApiHealth] = useState<ApiHealthUi>('checking')
  const [nostrAnnounce, setNostrAnnounce] = useState<TimestampPublishResult | null>(null)
  const [nostrBusy, setNostrBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getApiHealth().then(h => {
      if (!cancelled) setApiHealth(h.ok ? 'online' : 'offline')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const generate = async () => {
    const next = await hashApplicationPayload({ text: input, ts: new Date().toISOString() })
    setHash(next)
    setStampUi({ kind: 'idle' })
    setNostrAnnounce(null)
    setHistory(pushHashHistory(next))
  }

  /** Try Satohash API stamp; poll proof status; fall back to deep link when offline. */
  const stampViaApi = async () => {
    if (!hash || stampUi.kind === 'pending') return
    setStampUi({ kind: 'pending' })
    const result = await stampHash(hash, { filename: 'motopass-verify' })
    if (result.ok && result.id) {
      const verifyUrl = satohashProofVerifyUrl(result.id)
      setStampUi({ kind: 'api', id: result.id, status: result.status, verifyUrl })
      toast(t('verify.stampApiOk'), 'success')
      // Poll for Bitcoin anchor progress (non-blocking for UX after first paint)
      void pollStamp(result.id, { attempts: 4, intervalMs: 1200 }).then(polled => {
        if (!polled.ok) return
        setStampUi({
          kind: 'api',
          id: polled.id ?? result.id!,
          status: polled.status ?? result.status,
          verifyUrl,
          blockHeight: polled.bitcoin_block_height,
          confirmedAt: polled.confirmed_at,
        })
        if (polled.bitcoin_block_height != null) {
          toast(t('verify.stampAnchored'), 'success')
        }
      })
      return
    }
    const guideUrl = satohashStampGuideUrl(hash)
    setStampUi({ kind: 'fallback', guideUrl, error: result.error })
    setApiHealth('offline')
    toast(t('verify.stampApiFallback'), 'default')
  }

  const announceStampOnNostr = async () => {
    if (!hash || nostrBusy) return
    setNostrBusy(true)
    try {
      const satohashUrl =
        stampUi.kind === 'api'
          ? stampUi.verifyUrl
          : stampUi.kind === 'fallback'
            ? stampUi.guideUrl
            : satohashVerifyUrl(hash)
      const result = await announceTimestampOnNostr(
        buildTimestampAttestationEvent({
          hash,
          satohashUrl,
          stampId: stampUi.kind === 'api' ? stampUi.id : undefined,
          blockHeight: stampUi.kind === 'api' ? stampUi.blockHeight : undefined,
          status: stampUi.kind === 'api' ? stampUi.status : stampUi.kind === 'fallback' ? 'guide-fallback' : 'hashed',
          filename: 'motopass-verify',
        }),
      )
      setNostrAnnounce(result)
      try {
        sessionStorage.setItem('motopass-nostr-announce', result.json)
      } catch {
        /* private mode */
      }
      if (result.published) toast(t('verify.nostrAnnounceOk'), 'success')
      else if (result.error) toast(t('verify.nostrAnnounceFail'), 'error')
      else toast(t('verify.nostrAnnounceStub'), 'default')
    } finally {
      setNostrBusy(false)
    }
  }

  const copy = async () => {
    if (!hash) return
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) setInput(text.trim())
    } catch {
      /* clipboard blocked */
    }
  }

  async function reverify(entryHash: string) {
    setHash(entryHash)
    setHistory(pushHashHistory(entryHash))
  }

  async function runBatchVerify() {
    const hashes = parseHashLines(batchInput)
    if (!hashes.length) {
      setBatchResults([])
      return
    }
    setBatchBusy(true)
    setBatchProgress(0)
    try {
      const results: VerifyResult[] = []
      for (let i = 0; i < hashes.length; i++) {
        results.push(await verifyHashPaste(hashes[i]))
        setBatchProgress(Math.round(((i + 1) / hashes.length) * 100))
      }
      setBatchResults(results)
      hashes.forEach(h => pushHashHistory(h))
      setHistory(loadHashHistory())
    } finally {
      setBatchBusy(false)
      setBatchProgress(100)
    }
  }

  async function runOtsPasteVerify() {
    const hash = otsHash.trim() || parseHashLines(otsPaste)[0] || ''
    setOtsResult(verifyOtsPasteContent(otsPaste, hash))
  }

  async function handleOtsFile(file: File) {
    const text = await file.text()
    setOtsPaste(text)
    if (!otsHash.trim()) {
      const hashes = parseHashLines(text)
      if (hashes[0]) setOtsHash(hashes[0])
    }
    setOtsResult(verifyOtsPasteContent(text, otsHash.trim() || parseHashLines(text)[0] || ''))
  }

  const downloadBatchResultsJson = () => {
    if (!batchResults.length) return
    const payload = {
      schema: 'motopass-verify-batch/v1',
      exported_at: new Date().toISOString(),
      count: batchResults.length,
      results: batchResults,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `motopass-verify-batch-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast(t('verify.batchDownloaded'), 'success')
  }

  const copyAllBatchHashes = async () => {
    if (!batchResults.length) return
    await navigator.clipboard.writeText(batchResults.map(r => r.hash).join('\n'))
    setBatchCopied(true)
    toast(t('common.copied'), 'success')
    setTimeout(() => setBatchCopied(false), 2000)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <PageHeader eyebrow="SATOHASH.IO" title={t('verify.title')} subtitle={t('verify.sub')} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <BlockHeight />
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
            apiHealth === 'online'
              ? 'border-mp-proof/40 bg-mp-proof/10 text-mp-proof'
              : apiHealth === 'offline'
                ? 'border-status-amber/40 bg-status-amber/10 text-status-amber'
                : 'border-mp-border bg-card-muted text-ink-muted'
          }`}
          role="status"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              apiHealth === 'online'
                ? 'bg-mp-proof'
                : apiHealth === 'offline'
                  ? 'bg-status-amber'
                  : 'bg-ink-muted animate-pulse'
            }`}
            aria-hidden
          />
          {apiHealth === 'online'
            ? t('verify.apiOnline')
            : apiHealth === 'offline'
              ? t('verify.apiOffline')
              : t('verify.apiChecking')}
        </span>
      </div>

      <div className="card-elevated mt-8 space-y-4 border-l-4 border-l-btc-orange">
        <label htmlFor="verify-input" className="block text-sm font-medium text-ink-secondary">{t('verify.dataLabel')}</label>
        <textarea id="verify-input" value={input} onChange={e => setInput(e.target.value)} rows={4} className="input-field font-mono" />
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={paste} className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2">
            <ClipboardPaste size={14} /> {t('verify.pasteFromClipboard')}
          </button>
          <button
            type="button"
            onClick={() => toast(t('verify.qrScanStub'), 'default')}
            className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2"
            aria-label={t('verify.qrScan')}
          >
            <QrCode size={14} aria-hidden /> {t('verify.qrScan')}
          </button>
          <button type="button" onClick={generate} className="btn-primary w-full sm:w-auto">
            {t('verify.generateHash')}
          </button>
        </div>

        {hash && (
          <div className="space-y-3 pt-4 border-t border-mp">
            <div className="flex items-start gap-2">
              <code className="flex-1 text-xs font-mono text-btc-orange-deep break-all bg-btc-orange-soft p-3 rounded-mp-md border border-btc-orange/20">{hash}</code>
              <button type="button" onClick={copy} aria-label={t('verify.copyHash')} className="p-2.5 border border-mp rounded-mp-md shrink-0 hover:bg-section">
                {copied ? <Check size={16} className="text-status-green" /> : <Copy size={16} className="text-ink-muted" />}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => void stampViaApi()}
                disabled={stampUi.kind === 'pending'}
                className="btn-primary inline-flex items-center justify-center gap-2 flex-1"
              >
                {stampUi.kind === 'pending' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" aria-hidden /> {t('verify.stamping')}
                  </>
                ) : (
                  <>{t('verify.stampSatohash')}</>
                )}
              </button>
              {satohashVerifyUrl(hash) && (
              <a href={satohashVerifyUrl(hash)} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2 flex-1">
                {t('verify.verifyProof')} <ExternalLink size={14} />
              </a>
              )}
            </div>
            {stampUi.kind === 'api' && (
              <div className="rounded-mp-md border border-mp-proof/40 bg-mp-proof/10 px-3 py-2.5 text-xs space-y-1.5" role="status">
                <p className="font-chrome font-semibold text-mp-proof">{t('verify.stampProofReady')}</p>
                <p className="font-mono text-ink-secondary break-all">
                  {t('verify.stampProofId')}: {stampUi.id}
                  {stampUi.status ? ` · ${stampUi.status}` : ''}
                </p>
                {stampUi.blockHeight != null && (
                  <p className="font-mono text-mp-proof">
                    {t('verify.stampBlock')}: {stampUi.blockHeight}
                    {stampUi.confirmedAt ? ` · ${stampUi.confirmedAt}` : ''}
                  </p>
                )}
                <a
                  href={stampUi.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-btc-orange font-medium hover:underline"
                >
                  {t('verify.verifyProof')} <ExternalLink size={12} />
                </a>
              </div>
            )}
            {stampUi.kind === 'fallback' && (
              <div className="rounded-mp-md border border-status-amber/40 bg-status-amber/10 px-3 py-2.5 text-xs space-y-1.5" role="status">
                <p className="font-chrome font-semibold text-status-amber">{t('verify.stampApiOffline')}</p>
                {stampUi.error && <p className="text-ink-muted font-mono break-all">{stampUi.error}</p>}
                <a
                  href={stampUi.guideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-btc-orange font-medium hover:underline"
                >
                  {t('verify.stampGuideLink')} <ExternalLink size={12} />
                </a>
              </div>
            )}
            {(stampUi.kind === 'api' || stampUi.kind === 'fallback') && (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => void announceStampOnNostr()}
                  disabled={nostrBusy}
                  className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                >
                  {nostrBusy ? (
                    <>
                      <Loader2 size={14} className="animate-spin" aria-hidden /> {t('verify.nostrAnnouncing')}
                    </>
                  ) : (
                    t('verify.nostrAnnounce')
                  )}
                </button>
                <p className="text-[11px] text-ink-muted leading-relaxed">{t('verify.nostrAnnounceHint')}</p>
                <p className="text-[11px] text-status-amber leading-relaxed">{t('verify.nostrPublicWarn')}</p>
                {nostrAnnounce && (
                  <div className="rounded-mp-md border border-nostr-violet/30 bg-nostr-violet-soft/40 px-3 py-2.5 text-xs space-y-1.5" role="status">
                    <p className="font-chrome text-ink">
                      {nostrAnnounce.recovery === 'published'
                        ? t('verify.nostrRecoveryPublished')
                        : nostrAnnounce.recovery === 'signed-unpublished'
                          ? t('verify.nostrRecoverySigned')
                          : nostrAnnounce.recovery === 'rejected'
                            ? t('verify.nostrRecoveryRejected')
                            : t('verify.nostrRecoveryStub')}
                    </p>
                    <p className="font-mono text-ink-secondary break-all">
                      {t('verify.nostrEventId')}: {nostrAnnounce.eventId}
                    </p>
                    {nostrAnnounce.relaySummary && (
                      <p className="text-ink-muted">{nostrAnnounce.relaySummary}</p>
                    )}
                    {nostrAnnounce.error && (
                      <p className="text-status-amber font-mono break-all">{nostrAnnounce.error}</p>
                    )}
                    <pre className="text-[10px] font-mono text-ink-secondary overflow-x-auto whitespace-pre-wrap bg-card-muted/40 rounded-mp-md p-3 border border-mp/50">
                      {nostrAnnounce.json}
                    </pre>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(nostrAnnounce.json)
                        toast(t('common.copied'), 'success')
                      }}
                      className="btn-secondary text-xs !py-1 !px-2.5 inline-flex items-center gap-1"
                    >
                      <Copy size={12} aria-hidden /> {t('vault.copyNostr')}
                    </button>
                  </div>
                )}
              </div>
            )}
            <VerifyResultsExplainer messageKey="verify.resultsExplainer" />
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card-muted mt-6 space-y-3">
          <h2 className="font-chrome text-sm font-semibold text-ink flex items-center gap-2">
            <History size={14} className="text-btc-orange" aria-hidden />
            {t('verify.hashHistory')}
          </h2>
          <ul className="space-y-2">
            {history.map(entry => (
              <li
                key={`${entry.hash}-${entry.ts}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-mp-md border border-mp/60 bg-card px-3 py-2"
              >
                <code className="flex-1 text-[10px] font-mono text-ink-secondary break-all">
                  {entry.label ? `${entry.label} · ` : ''}
                  {entry.hash.slice(0, 20)}…
                </code>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void reverify(entry.hash)}
                    className="btn-secondary text-xs !py-1 !px-2.5 inline-flex items-center gap-1"
                  >
                    <RotateCcw size={12} aria-hidden />
                    {t('verify.reverify')}
                  </button>
                  {satohashVerifyUrl(entry.hash) && (
                  <a
                    href={satohashVerifyUrl(entry.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs !py-1 !px-2.5 inline-flex items-center gap-1"
                  >
                    Satohash <ExternalLink size={12} />
                  </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-elevated mt-6 space-y-4 border-l-4 border-l-nostr-violet/60">
        <h2 className="font-chrome text-sm font-semibold text-ink">{t('verify.otsPasteTitle')}</h2>
        <p className="text-xs text-ink-muted leading-relaxed">{t('verify.otsPasteHint')}</p>
        <label htmlFor="verify-ots-hash" className="block text-xs font-medium text-ink-secondary">
          {t('verify.otsHashOptional')}
        </label>
        <input
          id="verify-ots-hash"
          type="text"
          value={otsHash}
          onChange={e => setOtsHash(e.target.value)}
          placeholder={t('verify.hashPlaceholder')}
          className="input-field font-mono text-xs"
          spellCheck={false}
        />
        <textarea
          id="verify-ots-paste"
          value={otsPaste}
          onChange={e => setOtsPaste(e.target.value)}
          rows={4}
          placeholder={t('verify.otsPastePlaceholder')}
          className="input-field font-mono text-xs"
          spellCheck={false}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 cursor-pointer">
            <FileUp size={14} aria-hidden />
            {t('verify.otsUpload')}
            <input
              type="file"
              accept=".ots,.txt,application/octet-stream,text/plain"
              className="sr-only"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) void handleOtsFile(file)
                e.target.value = ''
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => runOtsPasteVerify()}
            disabled={!otsPaste.trim()}
            className="btn-primary w-full sm:w-auto"
          >
            {t('verify.otsParse')}
          </button>
        </div>
        {otsResult && (
          <div
            role="status"
            className={`rounded-mp-md border px-4 py-3 text-xs font-mono ${
              otsResult.verified
                ? 'border-mp-proof/40 bg-mp-proof/10 text-mp-proof'
                : 'border-status-amber/40 bg-status-amber/10 text-status-amber'
            }`}
          >
            {otsResult.message}
          </div>
        )}
      </div>

      <div className="card-elevated mt-6 space-y-4 border-l-4 border-l-mp-proof">
        <label htmlFor="verify-batch" className="block text-sm font-medium text-ink-secondary">
          {t('verify.batchHashes')}
        </label>
        <p className="text-xs text-ink-muted leading-relaxed">{t('verify.batchHashesHint')}</p>
        <textarea
          id="verify-batch"
          value={batchInput}
          onChange={e => setBatchInput(e.target.value)}
          rows={5}
          placeholder="One SHA-256 hash per line…"
          className="input-field font-mono text-xs"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => void runBatchVerify()}
          disabled={batchBusy || !batchInput.trim()}
          className="btn-primary w-full sm:w-auto"
        >
          {batchBusy ? t('verify.batchVerifying') : t('verify.batchVerify')}
        </button>
        {(batchBusy || batchProgress > 0) && (
          <div className="space-y-1.5" role="progressbar" aria-valuenow={batchProgress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-1.5 rounded-full bg-card-muted/80 overflow-hidden border border-mp/40">
              <div
                className="h-full bg-btc-orange transition-all duration-base ease-out"
                style={{ width: `${batchProgress}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-ink-muted">
              {formatT(t, 'verify.batchProgress', { pct: batchProgress })}
            </p>
          </div>
        )}
        {batchResults.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-mp">
            <p className="text-xs font-chrome text-ink-muted">{formatT(t, 'verify.batchResultCount', { count: batchResults.length })}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadBatchResultsJson}
                className="btn-secondary text-xs !py-1 !px-2.5 inline-flex items-center gap-1"
                aria-label={t('verify.batchDownloadJson')}
              >
                <Download size={12} aria-hidden />
                {t('verify.batchDownloadJson')}
              </button>
              <button
                type="button"
                onClick={() => void copyAllBatchHashes()}
                className="btn-secondary text-xs !py-1 !px-2.5 inline-flex items-center gap-1"
                aria-label={t('verify.copyAllHashes')}
              >
                {batchCopied ? <Check size={12} className="text-status-green" /> : <Copy size={12} />}
                {t('verify.copyAllHashes')}
              </button>
            </div>
          </div>
        )}
        {batchResults.length > 0 && (
          <ul className="space-y-2">
            {batchResults.map(result => (
              <li
                key={result.hash}
                className={`rounded-mp-md border px-3 py-2 text-xs font-mono ${
                  result.verified
                    ? 'border-mp-proof/40 bg-mp-proof/10 text-mp-proof'
                    : 'border-status-amber/40 bg-status-amber/10 text-status-amber'
                }`}
              >
                <div className="break-all">{result.hash.slice(0, 24)}…</div>
                <div className="mt-1 opacity-80">{result.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 text-xs text-ink-muted space-y-2 leading-relaxed card-muted">
        <p className="flex gap-2"><Shield size={14} className="text-btc-orange shrink-0 mt-0.5" /> {t('verify.explainer1')}</p>
        <p>{t('verify.explainer2')}</p>
      </div>
    </div>
  )
}