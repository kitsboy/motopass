import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, CheckCircle2, Copy, ExternalLink, MessageCircle, Radio, Rocket, Share2, X, Clock } from 'lucide-react'
import { NostrConnect } from '../components/NostrConnect'
import { hashApplicationPayload, satohashStampGuideUrl } from '../lib/satohash'
import { addApplication } from '../lib/storage'
import type { NostrSession } from '../lib/nostr'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { Input, Textarea } from '../components/ui/Input'
import { useLaunchGates, LAUNCH_GATES_REFRESH_MS } from '../hooks/useLaunchGates'
import { isOfficeHoursOpen, KIMI_TIMEZONE } from '../lib/agentOfficeHours'
import { BUILD_ID } from '../lib/buildInfo'
import { ApplyLaunchGatesDirectory } from '../components/apply/ApplyLaunchGatesDirectory'
import { ApplyFormProgressStepper } from '../components/apply/ApplyFormProgressStepper'
import { clearApplyDraft, loadApplyDraft, saveApplyDraft } from '../lib/applyDraftStorage'

const NOTES_MAX = 2000

function resolveApplyFields(programPrefill: string, proofPrefill: string) {
  if (programPrefill || proofPrefill) {
    const proofNote = proofPrefill
      ? `Satohash proof: ${proofPrefill}\nVerify: https://satohash.io/verify/${proofPrefill}`
      : ''
    return {
      name: '',
      program: programPrefill,
      notes: proofNote,
      proofHash: proofPrefill,
      draftRestored: false,
    }
  }
  const draft = loadApplyDraft()
  if (!draft) {
    return { name: '', program: '', notes: '', proofHash: '', draftRestored: false }
  }
  return {
    name: draft.name,
    program: draft.program,
    notes: draft.notes,
    proofHash: '',
    draftRestored: !!(draft.name || draft.program || draft.notes),
  }
}

export function ApplyPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { report, loading, applicationsOpen, agentsMessagingOpen } = useLaunchGates({ refreshMs: LAUNCH_GATES_REFRESH_MS })
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const programPrefill = searchParams.get('program') ?? ''
  const proofPrefill = searchParams.get('proof') ?? ''

  const initialFields = resolveApplyFields(programPrefill, proofPrefill)
  const [nostr, setNostr] = useState<NostrSession | null>(null)
  const [name, setName] = useState(initialFields.name)
  const [program, setProgram] = useState(initialFields.program)
  const [notes, setNotes] = useState(initialFields.notes)
  const [result, setResult] = useState<{ hash: string; id: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false)
  const draftRestored = initialFields.draftRestored && !draftBannerDismissed
  const kimiOfficeOpen = isOfficeHoursOpen(KIMI_TIMEZONE)

  useEffect(() => {
    if (result) return
    saveApplyDraft({ name, program, notes })
  }, [name, program, notes, result])

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
      clearApplyDraft()
      setResult({ hash, id })
      setCopied(false)
      const agentParams = new URLSearchParams({
        application: id,
        program: program.trim(),
        hash,
      })
      window.setTimeout(() => {
        navigate(`/agents?${agentParams.toString()}`)
      }, 2400)
    } finally {
      setSubmitting(false)
    }
  }

  const passed = report.gates.filter(g => g.pass).length
  const relayFake = report.relay_fake ?? report.relay_status === 'fake'

  return (
    <div key={`${programPrefill}-${proofPrefill}` || 'apply'} className="page-container px-4 sm:px-6 py-8 pb-24 md:pb-8 max-w-xl mx-auto">
      {applicationsOpen && (
        <Card variant="banner" animate delay={0} className="mb-6 flex items-start gap-3">
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
        </Card>
      )}

      <PageHeader eyebrow="MEMBERS · APPLICATIONS" title={t('apply.title')} subtitle={t('apply.sub')} />

      {applicationsOpen && !agentsMessagingOpen && (
        <Card animate delay={0.03} className="mb-6 flex items-start gap-3 border-nostr-violet/25">
          <MessageCircle size={18} className="text-nostr-violet shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="font-chrome text-sm font-semibold text-ink">{t('apply.agentsMessagingBannerTitle')}</p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">{t('apply.agentsMessagingBannerBody')}</p>
          </div>
        </Card>
      )}

      {relayFake && (
        <Card animate delay={0.05} className="mb-6 flex items-start gap-3 border-nostr-violet/25">
          <Radio size={18} className="text-nostr-violet shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="font-chrome text-sm font-semibold text-ink">{t('apply.relayFakeTitle')}</p>
            <p className="text-xs text-ink-muted mt-1 font-mono break-all opacity-80">
              {report.relay ?? 'wss://relay.motopass.giveabit.io'} · status: fake
            </p>
          </div>
        </Card>
      )}

      {!applicationsOpen && (
        <Card animate delay={0.08} className="mb-6 flex items-start gap-3 border-status-amber/30">
          <Clock size={18} className="text-status-amber shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="font-chrome text-sm font-semibold text-ink">{t('apply.officeHoursHintTitle')}</p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              {kimiOfficeOpen ? t('apply.officeHoursOpenNow') : t('apply.officeHoursClosed')}
            </p>
            <p className="text-[10px] font-mono text-ink-muted mt-2 opacity-80">
              {t('agents.officeHours')} · {t('agents.kimi.timezone')}
            </p>
          </div>
        </Card>
      )}

      <Card variant="elevated" animate delay={0.1} className="mb-6 overflow-hidden !p-0">
        <ApplyLaunchGatesDirectory
          report={report}
          loading={loading}
          applicationsOpen={applicationsOpen}
        />
      </Card>

      <div className="mb-6">
        <NostrConnect onConnect={setNostr} />
      </div>

      {proofPrefill && !result && (
        <Card variant="proof" animate delay={0.05} className="mb-6">
          <p className="font-chrome text-xs font-semibold text-mp-proof mb-1">{t('apply.vaultProofAttached')}</p>
          <code className="block text-[10px] font-mono text-ink-secondary break-all bg-card-muted/40 rounded-mp-md p-3 border border-mp-proof/25">
            {proofPrefill}
          </code>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              to={`/vault?proof=${encodeURIComponent(proofPrefill)}${programPrefill ? `&program=${encodeURIComponent(programPrefill)}` : ''}`}
              className="inline-flex items-center gap-1 text-xs text-mp-btc-text hover:underline"
            >
              {t('apply.vaultSourceRow')} →
            </Link>
            <a
              href={`https://satohash.io/verify/${proofPrefill}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-mp-btc-text hover:underline"
            >
              {t('apply.verifyOnSatohash')} <ExternalLink size={12} />
            </a>
          </div>
        </Card>
      )}

      {!result ? (
        <Card variant="elevated" className="space-y-4">
          {draftRestored && (
            <div className="flex items-start justify-between gap-3 rounded-mp-md border border-btc-orange/25 bg-btc-orange-soft/30 px-3 py-2.5">
              <p className="text-xs font-chrome text-ink-secondary leading-relaxed">{t('apply.draftRestoredBanner')}</p>
              <button
                type="button"
                onClick={() => setDraftBannerDismissed(true)}
                className="chip !p-1 shrink-0"
                aria-label={t('common.close')}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <ApplyFormProgressStepper
            name={name}
            program={program}
            notes={notes}
            hasNostr={!!nostr}
          />
          <form id="apply-form" onSubmit={submit} className="space-y-4">
            <fieldset disabled={!applicationsOpen || submitting} className="space-y-4 disabled:opacity-55">
              <Input
                id="apply-name"
                name="name"
                autoComplete="name"
                label={t('apply.yourName')}
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <Input
                id="apply-program"
                name="organization"
                autoComplete="organization"
                label={t('apply.targetProgram')}
                required
                value={program}
                onChange={e => setProgram(e.target.value)}
                placeholder={t('apply.programPlaceholder')}
              />
              <div className="space-y-1.5">
                <Textarea
                  id="apply-notes"
                  label={t('apply.notesOptional')}
                  value={notes}
                  maxLength={NOTES_MAX}
                  onChange={e => setNotes(e.target.value)}
                />
                <p
                  className={`text-[10px] font-mono text-right ${
                    notes.length >= NOTES_MAX ? 'text-status-amber' : 'text-ink-muted'
                  }`}
                  aria-live="polite"
                >
                  {formatT(t, 'apply.notesCharCount', { count: notes.length, max: NOTES_MAX })}
                </p>
              </div>
              <Button type="submit" className="w-full hidden md:inline-flex" disabled={!applicationsOpen || submitting} loading={submitting}>
                {submitting ? t('apply.hashing') : t('apply.submit')}
              </Button>
            </fieldset>
          </form>
          <div className="apply-mobile-submit-bar md:hidden" aria-hidden={!applicationsOpen}>
            <Button
              type="submit"
              form="apply-form"
              className="w-full"
              disabled={!applicationsOpen || submitting}
              loading={submitting}
            >
              {submitting ? t('apply.hashing') : t('apply.submit')}
            </Button>
          </div>
        </Card>
      ) : (
        <Card variant="proof" animate className="space-y-4 relative overflow-hidden apply-success-card">
          <div className="apply-confetti-lite pointer-events-none" aria-hidden />
          <div className="flex items-center gap-3 relative z-[1]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-mp-md bg-mp-proof/15 border border-mp-proof/30">
              <CheckCircle2 size={22} className="text-mp-proof" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-mp-proof">{t('apply.success')}</p>
              <p className="text-xs text-ink-muted mt-0.5">{t('apply.successSub')}</p>
            </div>
          </div>

          <div className="rounded-mp-md border border-mp/60 bg-card-muted/50 p-3 space-y-2 text-xs backdrop-blur-sm relative z-[1]">
            <p className="text-ink-muted">
              {t('apply.id')}: <span className="font-mono text-ink break-all">{result.id}</span>
            </p>
            <p className="text-ink-muted">
              {t('apply.targetProgram')}: <span className="font-semibold text-ink">{program}</span>
            </p>
          </div>

          <div className="relative z-[1]">
            <code className="block text-[10px] font-mono text-mp-btc-text break-all bg-btc-orange-soft/40 p-3 pr-12 rounded-mp-md border border-btc-orange/25">
              {result.hash}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(result.hash)
                setCopied(true)
                toast(t('common.copied'), 'success')
                setTimeout(() => setCopied(false), 2000)
              }}
              className="absolute top-2 right-2 chip text-xs !py-1 !px-2"
              aria-label={t('apply.copyHash')}
            >
              {copied ? <Check size={12} className="text-status-green" /> : <Copy size={12} />}
            </button>
          </div>

          <ol className="font-body text-xs text-ink-muted list-decimal pl-4 space-y-1.5 relative z-[1]">
            <li>{t('apply.stepStamp')}</li>
            <li>{t('apply.stepAgents')}</li>
          </ol>

          <div className="flex flex-col sm:flex-row gap-2 relative z-[1]">
            <a href={satohashStampGuideUrl(result.hash)} target="_blank" rel="noopener noreferrer" className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {t('apply.stampSatohash')} <ExternalLink size={14} />
            </a>
            <button
              type="button"
              className="btn-secondary w-full inline-flex items-center justify-center gap-2"
              onClick={async () => {
                const shareData = {
                  title: 'MotoPass application',
                  text: `${program} · ${result.hash}`,
                  url: satohashStampGuideUrl(result.hash),
                }
                if (typeof navigator.share === 'function') {
                  try {
                    await navigator.share(shareData)
                    toast(t('apply.shareSuccess'), 'success')
                    return
                  } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') return
                  }
                }
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
                toast(t('apply.shareStub'), 'default')
              }}
            >
              <Share2 size={14} aria-hidden />
              {t('apply.shareIntent')}
            </button>
          </div>
          <Link
            to={`/agents?application=${encodeURIComponent(result.id)}&program=${encodeURIComponent(program)}&hash=${encodeURIComponent(result.hash)}`}
            className="btn-secondary w-full text-center block relative z-[1]"
          >
            {t('apply.meetAgents')}
          </Link>
          <p className="font-body text-xs text-ink-muted leading-relaxed relative z-[1]">{t('apply.agentNotify')}</p>
          <Button type="button" variant="secondary" className="w-full relative z-[1]" onClick={() => setResult(null)}>
            {t('apply.registerAnother')}
          </Button>
        </Card>
      )}

      <p className="text-center font-chrome text-xs text-ink-muted mt-8">
        <Link to="/vault" className="text-mp-btc-text hover:underline underline-offset-2">Vault</Link>
        <span className="mx-2 opacity-40">·</span>
        <Link to="/agents" className="text-mp-btc-text hover:underline underline-offset-2">Agents</Link>
      </p>
    </div>
  )
}