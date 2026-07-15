import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, MessageCircle, Radio, Bot, Handshake, ArrowRight, Clock } from 'lucide-react'
import { MOTOPASS_RELAYS } from '../lib/nostr'
import { NostrConnect } from '../components/NostrConnect'
import { BtcMapReportVenue } from '../components/btcmap/BtcMapReportVenue'
import { AgentCardKimi } from '../components/AgentCardKimi'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'
import { HowItWorksSection } from '../components/ui/HowItWorksSection'
import { Card } from '../components/ui/Card'
import type { TranslationKey } from '../i18n/translations'

type AgentStatus = 'active' | 'beta' | 'coming'

const OFFICE_HOURS = 'Mon–Fri 9:00–17:00'

const AGENT_TIMEZONES: Record<string, string> = {
  uy: 'UYT (UTC−3)',
  sv: 'CST (UTC−6)',
  ae: 'GST (UTC+4)',
  sg: 'SGT (UTC+8)',
  pt: 'WET (UTC+0)',
  ge: 'GET (UTC+4)',
}

const AGENTS: {
  id: string
  country: string
  regionKey: TranslationKey
  focusKey: TranslationKey
  npub: string
  status: AgentStatus
}[] = [
  { id: 'uy', country: 'Uruguay', regionKey: 'agents.uy.region', focusKey: 'agents.uy.focus', npub: 'npub1motopass…uy', status: 'active' },
  { id: 'sv', country: 'El Salvador', regionKey: 'agents.sv.region', focusKey: 'agents.sv.focus', npub: 'npub1motopass…sv', status: 'active' },
  { id: 'ae', country: 'UAE', regionKey: 'agents.ae.region', focusKey: 'agents.ae.focus', npub: 'npub1motopass…ae', status: 'beta' },
  { id: 'sg', country: 'Singapore', regionKey: 'agents.sg.region', focusKey: 'agents.sg.focus', npub: 'npub1motopass…sg', status: 'beta' },
  { id: 'pt', country: 'Portugal', regionKey: 'agents.pt.region', focusKey: 'agents.pt.focus', npub: 'npub1motopass…pt', status: 'coming' },
  { id: 'ge', country: 'Georgia', regionKey: 'agents.ge.region', focusKey: 'agents.ge.focus', npub: 'npub1motopass…ge', status: 'coming' },
]

const STATUS_KEYS: Record<AgentStatus, TranslationKey> = {
  active: 'agents.statusActive',
  beta: 'agents.statusBeta',
  coming: 'agents.statusComing',
}

const statusClass = (s: AgentStatus) =>
  s === 'active' ? 'proof-badge' :
  s === 'beta' ? 'chip border-status-amber/40 bg-btc-orange-soft text-status-amber' :
  'chip'

export function AgentsPage() {
  const { t } = useI18n()
  const [dmPreview, setDmPreview] = useState<string | null>(null)

  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow={t('agents.eyebrow')} title={t('agents.title')} subtitle={t('agents.sub')} />

      <HowItWorksSection
        eyebrow={t('agents.how.eyebrow')}
        title={t('agents.how.title')}
        intro={t('agents.how.intro')}
        footerNote={t('agents.how.footer')}
        steps={[
          { n: '01', title: t('agents.how.step1.title'), body: t('agents.how.step1.body'), icon: Radio },
          { n: '02', title: t('agents.how.step2.title'), body: t('agents.how.step2.body'), icon: Zap },
          { n: '03', title: t('agents.how.step3.title'), body: t('agents.how.step3.body'), icon: MessageCircle, link: { to: '/vault', label: 'Verify proofs first' } },
          { n: '04', title: t('agents.how.step4.title'), body: t('agents.how.step4.body'), icon: Handshake, link: { to: '/apply', label: 'Open applications' } },
        ]}
      />

      <Card variant="banner" animate className="mb-8 !p-6">
        <span className="club-eyebrow block mb-2">{t('agents.nexus.title')}</span>
        <p className="font-body text-sm text-ink-secondary leading-relaxed max-w-3xl">{t('agents.nexus.sub')}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 mb-10">
        <Card variant="elevated" animate delay={0.05} className="!p-5 border-l-4 border-l-nostr-violet">
          <div className="flex items-center gap-2 mb-2">
            <Bot size={18} className="text-nostr-violet" aria-hidden />
            <h3 className="font-display font-semibold text-ink">{t('agents.paige.title')}</h3>
          </div>
          <p className="text-sm text-ink-secondary leading-relaxed mb-4">{t('agents.paige.body')}</p>
          <Link to="/programs" className="text-xs font-chrome font-medium text-nostr-violet inline-flex items-center gap-1 hover:underline underline-offset-2">
            Browse programs <ArrowRight size={12} />
          </Link>
        </Card>
        <Card variant="elevated" animate delay={0.08} className="!p-5 border-l-4 border-l-btc-orange">
          <div className="flex items-center gap-2 mb-2">
            <Handshake size={18} className="text-btc-orange" aria-hidden />
            <h3 className="font-display font-semibold text-ink">{t('agents.dealroom.title')}</h3>
          </div>
          <p className="text-sm text-ink-secondary leading-relaxed mb-4">{t('agents.dealroom.body')}</p>
          <Link to="/distressed" className="text-xs font-chrome font-medium text-mp-btc-text inline-flex items-center gap-1 hover:underline underline-offset-2">
            Distressed deal room <ArrowRight size={12} />
          </Link>
        </Card>
      </div>

      <div className="mb-10 max-w-xl">
        <AgentCardKimi />
      </div>

      <h2 className="font-display font-semibold text-lg text-ink mb-4">{t('agents.gridTitle')}</h2>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <NostrConnect />
        <span className="text-xs text-ink-muted">{t('agents.connectHint')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {AGENTS.map((a, i) => (
          <Card key={a.id} variant="elevated" animate delay={0.04 + i * 0.03} className="!p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-display font-semibold text-lg text-ink">{a.country}</h3>
                <p className="text-xs text-ink-muted">{t(a.regionKey)}</p>
              </div>
              <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${statusClass(a.status)}`}>
                {t(STATUS_KEYS[a.status])}
              </span>
            </div>
            <p className="text-sm text-ink-secondary mb-4 leading-relaxed">{t(a.focusKey)}</p>
            <div className="flex items-center gap-2 text-xs font-mono text-nostr-violet bg-nostr-violet-soft rounded-mp-md px-3 py-2 mb-4 border border-nostr-violet/15">
              <Zap size={12} aria-hidden /> {a.npub}
            </div>
            <button
              type="button"
              onClick={() => setDmPreview(JSON.stringify({
                kind: 14,
                tags: [['p', a.npub]],
                content: `MotoPass agent inquiry — ${a.country}`,
                relays: MOTOPASS_RELAYS,
              }, null, 2))}
              className="btn-secondary w-full text-sm !py-2"
            >
              <MessageCircle size={14} aria-hidden /> {t('agents.message')}
            </button>
          </Card>
        ))}
      </div>

      <h2 className="font-display font-semibold text-lg text-ink mb-2 mt-10">Agent availability</h2>
      <p className="text-sm text-ink-muted mb-4 max-w-2xl">
        Placeholder office hours per liaison region — local time, weekdays only. Live scheduling ships with Nexus club gates.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10">
        {AGENTS.map((a, i) => (
          <Card key={`hours-${a.id}`} variant="elevated" animate delay={0.04 + i * 0.03} className="!p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-display font-semibold text-lg text-ink">{a.country}</h3>
                <p className="text-xs text-ink-muted">{t(a.regionKey)}</p>
              </div>
              <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${statusClass(a.status)}`}>
                {t(STATUS_KEYS[a.status])}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-ink-secondary mb-2">
              <Clock size={14} className="text-nostr-violet shrink-0 mt-0.5" aria-hidden />
              <span>{OFFICE_HOURS}</span>
            </div>
            <p className="text-xs font-mono text-ink-muted bg-card-muted/50 rounded-mp-md px-3 py-2 border border-mp/50">
              {AGENT_TIMEZONES[a.id]} · local time
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-10 max-w-xl mx-auto">
        <BtcMapReportVenue />
      </div>

      {dmPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <Card variant="elevated" className="max-w-lg w-full !p-5 shadow-mp-4">
            <h3 className="font-display font-semibold text-ink mb-2">Nostr DM stub</h3>
            <pre className="text-[10px] font-mono text-ink-secondary overflow-auto max-h-64 bg-card-muted/50 p-3 rounded-mp-md border border-mp/50">{dmPreview}</pre>
            <button type="button" className="btn-primary mt-4 text-sm" onClick={() => { navigator.clipboard?.writeText(dmPreview); setDmPreview(null) }}>
              Copy & close
            </button>
          </Card>
        </div>
      )}

      <p className="text-xs text-ink-muted mt-6 text-center max-w-2xl mx-auto leading-relaxed">
        {t('agents.disclaimer')}
      </p>
    </div>
  )
}