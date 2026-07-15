import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExternalLink, Shield, Copy, Check, ClipboardPaste, History, RotateCcw, QrCode } from 'lucide-react'
import { hashApplicationPayload, satohashStampGuideUrl, satohashVerifyUrl } from '../lib/satohash'
import { buildPageVerifyPayload } from '../lib/pageVerify'
import { parseHashLines, verifyHashPaste } from '../lib/seal/vaultVerify'
import { loadHashHistory, pushHashHistory } from '../lib/verifyHashHistory'
import { BlockHeight } from '../components/BlockHeight'
import { VerifyResultsExplainer } from '../components/verify/VerifyResultsExplainer'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'
import { useToast } from '../components/ui/Toast'
import { formatT } from '../i18n/format'
import type { VerifyResult } from '../types/proof'

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

  const generate = async () => {
    const next = await hashApplicationPayload({ text: input, ts: new Date().toISOString() })
    setHash(next)
    setHistory(pushHashHistory(next, input.slice(0, 48)))
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
      <BlockHeight />

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
              <a href={satohashStampGuideUrl(hash)} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center justify-center gap-2 flex-1">
                {t('verify.stampSatohash')} <ExternalLink size={14} />
              </a>
              <a href={satohashVerifyUrl(hash)} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2 flex-1">
                {t('verify.verifyProof')} <ExternalLink size={14} />
              </a>
            </div>
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
                  <a
                    href={satohashVerifyUrl(entry.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs !py-1 !px-2.5 inline-flex items-center gap-1"
                  >
                    Satohash <ExternalLink size={12} />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-mp">
            <p className="text-xs font-chrome text-ink-muted">{formatT(t, 'verify.batchResultCount', { count: batchResults.length })}</p>
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