import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExternalLink, Shield, Copy, Check } from 'lucide-react'
import { hashApplicationPayload, satohashStampGuideUrl, satohashVerifyUrl } from '../lib/satohash'
import { BlockHeight } from '../components/BlockHeight'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'

export function VerifyPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState('MotoPass — Truth You Can Verify')
  const [hash, setHash] = useState(() => searchParams.get('hash') ?? '')
  const [copied, setCopied] = useState(false)

  const generate = async () => setHash(await hashApplicationPayload({ text: input, ts: new Date().toISOString() }))

  const copy = async () => {
    if (!hash) return
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <PageHeader eyebrow="SATOHASH.IO" title={t('verify.title')} subtitle={t('verify.sub')} />
      <BlockHeight />

      <div className="card-elevated mt-8 space-y-4 border-l-4 border-l-btc-orange">
        <label htmlFor="verify-input" className="block text-sm font-medium text-ink-secondary">{t('verify.dataLabel')}</label>
        <textarea id="verify-input" value={input} onChange={e => setInput(e.target.value)} rows={4} className="input-field font-mono" />
        <button type="button" onClick={generate} className="btn-primary w-full sm:w-auto">
          {t('verify.generateHash')}
        </button>

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
          </div>
        )}
      </div>

      <div className="mt-8 text-xs text-ink-muted space-y-2 leading-relaxed card-muted">
        <p className="flex gap-2"><Shield size={14} className="text-btc-orange shrink-0 mt-0.5" /> {t('verify.explainer1')}</p>
        <p>{t('verify.explainer2')}</p>
      </div>
    </div>
  )
}