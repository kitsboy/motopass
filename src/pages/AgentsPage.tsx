import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, MessageCircle, Radio, Bot, Handshake, ArrowRight, Clock } from 'lucide-react'
import { MOTOPASS_RELAYS } from '../lib/nostr'
import { NostrConnect } from '../components/NostrConnect'
import { BtcMapReportVenue } from '../components/btcmap/BtcMapReportVenue'
import { AgentCardKimi } from '../components/AgentCardKimi'
import { AgentRegionMap } from '../components/agents/AgentRegionMap'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'
import { HowItWorksSection } from '../components/ui/HowItWorksSection'
import { Card } from '../components/ui/Card'
import { CopyField } from '../components/ui/CopyField'
import { useToast } from '../components/ui/Toast'
import { formatT } from '../i18n/format'
import { AGENT_SLA } from '../lib/agentOfficeHours'
import type { TranslationKey } from '../i18n/translations'

type AgentStatus = 'active' | 'beta' | 'coming'
type StatusFilter = 'all' | AgentStatus

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

const FILTER_CHIPS: { id: StatusFilter; key: TranslationKey }[] = [
  { id: 'all', key: 'agents.filterAll' },
  { id: 'active', key: 'agents.filterActive' },
  { id: 'beta', key: 'agents.filterBeta' },
  { id: 'coming', key: 'agents.filterComing' },
]

const statusClass = (s: AgentStatus) =>
  s === 'active' ? 'proof-badge' :
  s === 'beta' ? 'chip border-status-amber/40 bg-btc-orange-soft text-status-amber' :
  'chip'

function buildDmStub(country: string, npub: string) {
  return JSON.stringify({
    kind: 14,
    tags: [['p', npub]],
    content: `MotoPass agent inquiry — ${country}`,
    relays: MOTOPASS_RELAYS,
  }, null, 2)
}

export function AgentsPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: AGENTS.length, active: 0, beta: 0, coming: 0 }
    for (const a of AGENTS) counts[a.status] += 1
    return counts
  }, [])

  const filteredAgents = useMemo(
    () => (statusFilter === 'all' ? AGENTS : AGENTS.filter(a => a.status === statusFilter)),
    [statusFilter],
  )

  const copyDm = async (agent: (typeof AGENTS)[number]) => {
    const stub = buildDmStub(agent.country, agent.npub)
    try {
      await navigator.clipboard.writeText(stub)
      toast(t('agents.copyDm'), 'success')
    } catch {
      toast(t('agents.copyDm'), 'error')
    }
  }

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
            {t('agents.paige.cta')} <ArrowRight size={12} />
          </Link>
        </Card>
        <Card variant="elevated" animate delay={0.08} className="!p-5 border-l-4 border-l-btc-orange">
          <div className="flex items-center gap-2 mb-2">
            <Handshake size={18} className="text-btc-orange" aria-hidden />
            <h3 className="font-display font-semibold text-ink">{t('agents.dealroom.title')}</h3>
          </div>
          <p className="text-sm text-ink-secondary leading-relaxed mb-4">{t('agents.dealroom.body')}</p>
          <Link to="/distressed" className="text-xs font-chrome font-medium text-mp-btc-text inline-flex items-center gap-1 hover:underline underline-offset-2">
            {t('agents.dealroom.cta')} <ArrowRight size={12} />
          </Link>
        </Card>
      </div>

      <AgentRegionMap />

      <div className="mb-10 max-w-xl">
        <AgentCardKimi />
      </div>

      <h2 className="font-display font-semibold text-lg text-ink mb-4">{t('agents.gridTitle')}</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={statusFilter === chip.id}
            onClick={() => setStatusFilter(chip.id)}
            className={statusFilter === chip.id ? 'chip-active text-xs' : 'chip text-xs'}
          >
            {t(chip.key)}
            <span className="ml-1.5 font-mono text-[10px] opacity-70">{statusCounts[chip.id]}</span>
          </button>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <NostrConnect />
        <span className="text-xs text-ink-muted">{t('agents.connectHint')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredAgents.map((a, i) => (
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
            <div className="mb-4">
              <CopyField label={t('agents.copyNpub')} value={a.npub} truncate />
            </div>
            <button
              type="button"
              onClick={() => void copyDm(a)}
              className="btn-secondary w-full text-sm !py-2"
            >
              <MessageCircle size={14} aria-hidden /> {t('agents.message')}
            </button>
          </Card>
        ))}
      </div>

      <h2 className="font-display font-semibold text-lg text-ink mb-2 mt-10">{t('agents.officeHoursTitle')}</h2>
      <p className="text-sm text-ink-muted mb-4 max-w-2xl">{t('agents.officeHoursSub')}</p>
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
              <span>{t('agents.officeHours')}</span>
            </div>
            <p className="text-xs font-mono text-ink-muted bg-card-muted/50 rounded-mp-md px-3 py-2 border border-mp/50 mb-2">
              {AGENT_TIMEZONES[a.id]} · {t('agents.localTime')}
            </p>
            <p className="text-[10px] font-chrome text-ink-muted uppercase tracking-wider">
              {formatT(t, 'agents.slaPlaceholder', { sla: AGENT_SLA[a.id] ?? '48–72h' })}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-10 max-w-xl mx-auto">
        <BtcMapReportVenue />
      </div>

      <p className="text-xs text-ink-muted mt-6 text-center max-w-2xl mx-auto leading-relaxed">
        {t('agents.disclaimer')}
      </p>
    </div>
  )
}