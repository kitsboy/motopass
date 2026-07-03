import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { NostrConnect } from '../components/NostrConnect'
import { hashApplicationPayload, satohashStampGuideUrl } from '../lib/satohash'
import { addApplication } from '../lib/storage'
import type { NostrSession } from '../lib/nostr'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'

export function ApplyPage() {
  const { t } = useI18n()
  const [nostr, setNostr] = useState<NostrSession | null>(null)
  const [name, setName] = useState('')
  const [program, setProgram] = useState('')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<{ hash: string; id: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !program.trim()) return
    const payload = { applicant: name.trim(), program: program.trim(), npub: nostr?.npub ?? null, notes: notes.trim() || null, created: new Date().toISOString(), platform: 'MotoPass' }
    const hash = await hashApplicationPayload(payload)
    const id = `app-${Date.now()}`
    addApplication({ id, programName: program.trim(), applicantName: name.trim(), npub: nostr?.npub, status: 'interest', createdAt: payload.created, dataHash: hash, satohashUrl: satohashStampGuideUrl(hash), notes: notes.trim() || undefined })
    setResult({ hash, id })
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-xl mx-auto">
      <PageHeader eyebrow="APPLICATIONS" title={t('apply.title')} subtitle={t('apply.sub')} />

      <div className="mb-6">
        <NostrConnect onConnect={setNostr} />
      </div>

      {!result ? (
        <form onSubmit={submit} className="card-elevated space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-muted block mb-1.5">Your name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted block mb-1.5">Target program / country</label>
            <input required value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. Uruguay RBI" className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted block mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-field" />
          </div>
          <button type="submit" className="btn-primary w-full">{t('apply.submit')}</button>
        </form>
      ) : (
        <div className="card space-y-4">
          <p className="text-status-green text-sm font-semibold">Application registered locally</p>
          <p className="text-xs text-ink-muted">ID: <span className="font-mono text-ink">{result.id}</span></p>
          <code className="block text-[10px] font-mono text-btc-orange-deep break-all bg-btc-orange-soft p-3 rounded-mp-md border border-btc-orange/20">{result.hash}</code>
          <a href={satohashStampGuideUrl(result.hash)} target="_blank" rel="noopener noreferrer" className="btn-primary w-full inline-flex items-center justify-center gap-2">
            Stamp on Satohash.io <ExternalLink size={14} />
          </a>
          <p className="text-xs text-ink-muted leading-relaxed">
            Your liaison agent will be notified when Nostr relay is live. Timestamp this hash on Bitcoin for independent proof.
          </p>
          <button type="button" onClick={() => setResult(null)} className="btn-secondary w-full">Register another</button>
        </div>
      )}
    </div>
  )
}