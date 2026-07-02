import { useState } from 'react'
import { ExternalLink, Shield, Copy, Check } from 'lucide-react'
import { hashApplicationPayload, satohashStampGuideUrl, satohashVerifyUrl } from '../lib/satohash'
import { BlockHeight } from '../components/BlockHeight'
import { useI18n } from '../i18n/I18nContext'

export function VerifyPage() {
  const { t } = useI18n()
  const [input, setInput] = useState('MotoPass — Truth You Can Verify')
  const [hash, setHash] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    const h = await hashApplicationPayload({ text: input, ts: new Date().toISOString() })
    setHash(h)
  }

  const copy = async () => {
    if (!hash) return
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <div className="section-label mb-1 flex items-center gap-2"><Shield size={12} /> SATOHASH.IO</div>
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-2">{t('verify.title')}</h1>
      <p className="text-sm text-sovereign-silver mb-4">{t('verify.sub')}</p>
      <BlockHeight />

      <div className="card mt-8 space-y-4">
        <label className="block text-sm text-sovereign-silver">Data to hash (application text, JSON, legal extract)</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={4}
          className="w-full bg-sovereign-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-btc-orange/50"
        />
        <button type="button" onClick={generate} className="btn-primary w-full sm:w-auto">
          Generate SHA-256 hash
        </button>

        {hash && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-start gap-2">
              <code className="flex-1 text-xs font-mono text-btc-orange break-all bg-black/40 p-3 rounded-lg">{hash}</code>
              <button type="button" onClick={copy} className="p-2 border border-white/15 rounded-lg shrink-0">
                {copied ? <Check size={16} className="text-status-green" /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <a href={satohashStampGuideUrl(hash)} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center justify-center gap-2 flex-1">
                Stamp on Satohash <ExternalLink size={14} />
              </a>
              <a href={satohashVerifyUrl(hash)} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2 flex-1">
                Verify proof <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-xs text-sovereign-silver space-y-2">
        <p>OpenTimestamps anchors your hash to a Bitcoin block. Satohash.io (Give A Bit) provides human-readable verification receipts.</p>
        <p>Passport applications registered in MotoPass automatically generate a canonical JSON hash for stamping.</p>
      </div>
    </div>
  )
}