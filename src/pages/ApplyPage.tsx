import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, CheckCircle2, Copy, ExternalLink, Loader2, Radio, Rocket, ShieldCheck } from 'lucide-react'
import { NostrConnect } from '../components/NostrConnect'
import { hashApplicationPayload, satohashStampGuideUrl } from '../lib/satohash'
import { addApplication } from '../lib/storage'
import type { NostrSession } from '../lib/nostr'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassCard } from '../components/ui/GlassCard'
import { useLaunchGates } from '../hooks/useLaunchGates'
import { BUILD_ID } from '../lib/buildInfo'

export function ApplyPage() {
  const { t } = useI18n()
  const { report, loading, applicationsOpen } = useLaunchGates()
  const [searchParams] = useSearchParams()
  const programPrefill = searchParams.get('program') ?? ''

  const [nostr, setNostr] = useState<NostrSession | null>(null)
  const [name, setName] = useState('')
  const [program, setProgram] = useState(programPrefill)
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<{ hash: string; id: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applicationsOpen || !name.trim() || !program.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        applicant: name.trim(),
        program: program.trim(),
        npub: nostr?.npub ?? null,
        notes: notes.trim() || null,
        created: new Date().toISOString(),
        platform: 'MotoPass',
      }
      const hash = await hashApplicationPayload(payload)
      const id = `app-${Date.now()}`
      addApplication({
        id,
        programName: program.trim(),
        applicantName: name.trim(),
        npub: nostr?.npub,
        status: 'interest',
        createdAt: payload.created,
        dataHash: hash,
        satohashUrl: satohashStampGuideUrl(hash),
        notes: notes.trim() || undefined,
      })
      setResult({ hash, id })
      setCopied(false)
    } finally {
      setSubmitting(false)
    }
  }

  const passed = report.gates.filter(g => g.pass).length
  const relayFake = report.relay_fake ?? report.relay_status === 'fake'

  return (
    <div key={programPrefill || 'apply'} className="page-container px-4 sm:px-6 py-8 max-w-xl mx-auto">
      {applicationsOpen && (
        <GlassCard variant="banner" animate delay={0} className="mb-6 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-mp-md bg-btc-orange/15 border border-btc-orange/25">
            <Rocket size={18} className="text-btc-orange" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-ink">{t('apply.launchBannerTitle')}</p>
            <p className="font-body text-xs text-ink-secondary mt-1 leading-relaxed">{t('apply.launchBannerBody')}</p>
            <p className="text-[10px] font-mono text-mp-btc-text mt-2 tracking-wide">
              {BUILD_ID} · {passed}/{report.gates.length} gates · applications_open
            </p>
          </div>
        </GlassCard>
      )}

      <PageHeader eyebrow="APPLICATIONS" title={t('apply.title')} subtitle={t('apply.sub')} />

      {relayFake && (
        <GlassCard animate delay={0.05} className="mb-6 flex items-start gap-3 border-nostr-violet/25">
          <Radio size={18} className="text-nostr-violet shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="font-chrome text-sm font-semibold text-ink">{t('apply.relayFakeTitle')}</p>
            <p className="text-xs text-ink-muted mt-1 font-mono break-all opacity-80">
              {report.relay ?? 'wss://relay.motopass.giveabit.io'} · status: fake
            </p>
          </div>
        </GlassCard>
      )}

      <GlassCard variant="elevated" animate delay={0.1} className="mb-6" aria-labelledby="apply-gates-heading">
        <h2 id="apply-gates-heading" className="font-chrome text-sm font-semibold text-ink flex items-center gap-2 mb-4 min-w-0">
          <ShieldCheck size={16} className="text-mp-proof shrink-0" aria-hidden />
          <span className="truncate">{t('apply.gatesHeading')}</span>
          {applicationsOpen && (
            <span className="rounded-chip border border-btc-orange/35 bg-btc-orange-soft/50 text-mp-btc-text text-[10px] font-mono px-2 py-0.5 ml-auto shrink-0">
              OPEN · {passed}/{report.gates.length}
            </span>
          )}
        </h2>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-ink-muted font-mono py-2">
            <Loader2 size={14} className="animate-spin text-btc-orange" aria-hidden />
            Loading launch-gates.json…
          </div>
        ) : (
          <ul className="space-y-2">
            {report.gates.map((g, i) => (
              <li
                key={g.id}
                className={g.pass ? 'gate-card-pass' : 'gate-card-pending'}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-mono font-semibold text-ink truncate">
                    {g.pass ? '✓' : '○'} {g.id} · {g.pillar}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider shrink-0 ${g.pass ? 'text-mp-proof' : 'text-ink-muted'}`}>
                    {g.pass ? 'pass' : 'pending'}
                  </span>
                </div>
                <p className="font-body text-ink-secondary mt-1 break-words">{g.name}</p>
                <p className="text-ink-muted font-mono text-[10px] mt-0.5 break-words opacity-75">{g.detail}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-ink-muted font-mono mt-4 break-all opacity-60">
          {BUILD_ID} · <code>npm run launch:gate</code>
        </p>
      </GlassCard>

      <div className="mb-6">
        <NostrConnect onConnect={setNostr} />
      </div>

      {!result ? (
        <form onSubmit={submit} className="glass-card-elevated space-y-4">
          <fieldset disabled={!applicationsOpen || submitting} className="space-y-4 disabled:opacity-55">
            <div>
              <label htmlFor="apply-name" className="font-chrome text-xs font-medium text-ink-muted block mb-1.5">
                {t('apply.yourName')}
              </label>
              <input id="apply-name" required value={name} onChange={e => setName(e.target.value)} className="input-field w-full" />
            </div>
            <div>
              <label htmlFor="apply-program" className="font-chrome text-xs font-medium text-ink-muted block mb-1.5">
                {t('apply.targetProgram')}
              </label>
              <input
                id="apply-program"
                required
                value={program}
                onChange={e => setProgram(e.target.value)}
                placeholder={t('apply.programPlaceholder')}
                className="input-field w-full"
              />
            </div>
            <div>
              <label htmlFor="apply-notes" className="font-chrome text-xs font-medium text-ink-muted block mb-1.5">
                {t('apply.notesOptional')}
              </label>
              <textarea id="apply-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-field w-full resize-y" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={!applicationsOpen || submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Hashing…
                </>
              ) : (
                t('apply.submit')
              )}
            </button>
          </fieldset>
        </form>
      ) : (
        <GlassCard variant="proof" animate className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-mp-md bg-mp-proof/15 border border-mp-proof/30">
              <CheckCircle2 size={22} className="text-mp-proof" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-mp-proof">{t('apply.success')}</p>
              <p className="text-xs text-ink-muted mt-0.5">{t('apply.successSub')}</p>
            </div>
          </div>

          <div className="rounded-mp-md border border-mp/60 bg-card-muted/50 p-3 space-y-2 text-xs backdrop-blur-sm">
            <p className="text-ink-muted">
              {t('apply.id')}: <span className="font-mono text-ink break-all">{result.id}</span>
            </p>
            <p className="text-ink-muted">
              {t('apply.targetProgram')}: <span className="font-semibold text-ink">{program}</span>
            </p>
          </div>

          <div className="relative">
            <code className="block text-[10px] font-mono text-mp-btc-text break-all bg-btc-orange-soft/40 p-3 pr-12 rounded-mp-md border border-btc-orange/25">
              {result.hash}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(result.hash)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="absolute top-2 right-2 chip text-xs !py-1 !px-2"
              aria-label={t('apply.copyHash')}
            >
              {copied ? <Check size={12} className="text-status-green" /> : <Copy size={12} />}
            </button>
          </div>

          <ol className="font-body text-xs text-ink-muted list-decimal pl-4 space-y-1.5">
            <li>{t('apply.stepStamp')}</li>
            <li>{t('apply.stepAgents')}</li>
          </ol>

          <a href={satohashStampGuideUrl(result.hash)} target="_blank" rel="noopener noreferrer" className="btn-primary w-full inline-flex items-center justify-center gap-2">
            {t('apply.stampSatohash')} <ExternalLink size={14} />
          </a>
          <Link to="/agents" className="btn-secondary w-full text-center">{t('apply.meetAgents')}</Link>
          <p className="font-body text-xs text-ink-muted leading-relaxed">{t('apply.agentNotify')}</p>
          <button type="button" onClick={() => setResult(null)} className="btn-secondary w-full">
            {t('apply.registerAnother')}
          </button>
        </GlassCard>
      )}

      <p className="text-center font-chrome text-xs text-ink-muted mt-8">
        <Link to="/vault" className="text-mp-btc-text hover:underline underline-offset-2">Vault</Link>
        <span className="mx-2 opacity-40">·</span>
        <Link to="/agents" className="text-mp-btc-text hover:underline underline-offset-2">Agents</Link>
      </p>
    </div>
  )
}