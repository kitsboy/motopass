import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Zap, MessageCircle, Radio, Bot, Handshake, ArrowRight, Clock } from 'lucide-react'
import { getPrimaryNostrRelay } from '../lib/nostr'
import { buildAgentDmCopyText } from '../lib/nostrDmStub'
import { SeoHead } from '../components/SeoHead'
import { kimiPersonJsonLd } from '../lib/siteJsonLd'
import { NostrConnect } from '../components/NostrConnect'
import { BtcMapReportVenue } from '../components/btcmap/BtcMapReportVenue'
import { AgentCardKimi } from '../components/AgentCardKimi'
import { AgentRegionMap } from '../components/agents/AgentRegionMap'
import { PaigeChat } from '../components/PaigeChat'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'
import { HowItWorksSection } from '../components/ui/HowItWorksSection'
import { Card } from '../components/ui/Card'
import { CopyField } from '../components/ui/CopyField'
import { useToast } from '../components/ui/Toast'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { PageAnchorNav } from '../components/nav/PageAnchorNav'
import { formatT } from '../i18n/format'
import { estimateReadingMinutes } from '../lib/utils'
import { AGENT_SLA } from '../lib/agentOfficeHours'
import { useLaunchGates } from '../hooks/useLaunchGates'
import type { TranslationKey } from '../i18n/translations'

type AgentStatus = 'active' | 'beta' | 'coming'
type StatusFilter = 'all' | AgentStatus
type RegionFilter = 'all' | 'South America' | 'Central America' | 'Middle East' | 'Asia' | 'Europe'

const VALID_STATUS: StatusFilter[] = ['all', 'active', 'beta', 'coming']
const VALID_REGIONS: RegionFilter[] = ['all', 'South America', 'Central America', 'Middle East', 'Asia', 'Europe']

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
  region: Exclude<RegionFilter, 'all'>
  regionKey: TranslationKey
  focusKey: TranslationKey
  npub: string
  status: AgentStatus
}[] = [
  { id: 'uy', country: 'Uruguay', region: 'South America', regionKey: 'agents.uy.region', focusKey: 'agents.uy.focus', npub: 'npub1motopass…uy', status: 'active' },
  { id: 'sv', country: 'El Salvador', region: 'Central America', regionKey: 'agents.sv.region', focusKey: 'agents.sv.focus', npub: 'npub1motopass…sv', status: 'active' },
  { id: 'ae', country: 'UAE', region: 'Middle East', regionKey: 'agents.ae.region', focusKey: 'agents.ae.focus', npub: 'npub1motopass…ae', status: 'beta' },
  { id: 'sg', country: 'Singapore', region: 'Asia', regionKey: 'agents.sg.region', focusKey: 'agents.sg.focus', npub: 'npub1motopass…sg', status: 'beta' },
  { id: 'pt', country: 'Portugal', region: 'Europe', regionKey: 'agents.pt.region', focusKey: 'agents.pt.focus', npub: 'npub1motopass…pt', status: 'coming' },
  { id: 'ge', country: 'Georgia', region: 'Europe', regionKey: 'agents.ge.region', focusKey: 'agents.ge.focus', npub: 'npub1motopass…ge', status: 'coming' },
]

const STATUS_KEYS: Record<AgentStatus, TranslationKey> = {
  active: 'agents.statusActive',
  beta: 'agents.statusBeta',
  coming: 'agents.statusComing',
}

const STATUS_FILTER_CHIPS: { id: StatusFilter; key: TranslationKey }[] = [
  { id: 'all', key: 'agents.filterAll' },
  { id: 'active', key: 'agents.filterActive' },
  { id: 'beta', key: 'agents.filterBeta' },
  { id: 'coming', key: 'agents.filterComing' },
]

const REGION_FILTER_CHIPS: { id: RegionFilter; key: TranslationKey }[] = [
  { id: 'all', key: 'agents.filterRegionAll' },
  { id: 'South America', key: 'agents.filterRegionSouthAmerica' },
  { id: 'Central America', key: 'agents.filterRegionCentralAmerica' },
  { id: 'Middle East', key: 'agents.filterRegionMiddleEast' },
  { id: 'Asia', key: 'agents.filterRegionAsia' },
  { id: 'Europe', key: 'agents.filterRegionEurope' },
]

const statusClass = (s: AgentStatus) =>
  s === 'active' ? 'proof-badge' :
  s === 'beta' ? 'chip border-status-amber/40 bg-btc-orange-soft text-status-amber' :
  'chip'

function parseStatusFilter(raw: string | null): StatusFilter {
  if (raw && VALID_STATUS.includes(raw as StatusFilter)) return raw as StatusFilter
  return 'all'
}

function parseRegionFilter(raw: string | null): RegionFilter {
  if (raw && VALID_REGIONS.includes(raw as RegionFilter)) return raw as RegionFilter
  return 'all'
}

export function AgentsPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const { report } = useLaunchGates()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = parseStatusFilter(searchParams.get('status'))
  const regionFilter = parseRegionFilter(searchParams.get('region'))
  const primaryRelay = getPrimaryNostrRelay()
  const [nostrBusy, setNostrBusy] = useState(true)

  const distressedGateOpen = report.gates.find((g) => g.id === 'G2')?.pass === true
  const applicationId = searchParams.get('application')
  const applicationProgram = searchParams.get('program')
  const applicationHash = searchParams.get('hash')
  const hasApplicationContext = Boolean(applicationId && applicationProgram)

  useEffect(() => {
    const timer = window.setTimeout(() => setNostrBusy(false), 480)
    return () => window.clearTimeout(timer)
  }, [])

  const setStatusFilter = (next: StatusFilter) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'all') params.delete('status')
    else params.set('status', next)
    setSearchParams(params, { replace: true })
  }

  const setRegionFilter = (next: RegionFilter) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'all') params.delete('region')
    else params.set('region', next)
    setSearchParams(params, { replace: true })
  }

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: AGENTS.length, active: 0, beta: 0, coming: 0 }
    for (const a of AGENTS) counts[a.status] += 1
    return counts
  }, [])

  const regionCounts = useMemo(() => {
    const counts: Record<RegionFilter, number> = {
      all: AGENTS.length,
      'South America': 0,
      'Central America': 0,
      'Middle East': 0,
      Asia: 0,
      Europe: 0,
    }
    for (const a of AGENTS) counts[a.region] += 1
    return counts
  }, [])

  const filteredAgents = useMemo(
    () =>
      AGENTS.filter((a) => {
        const statusOk = statusFilter === 'all' || a.status === statusFilter
        const regionOk = regionFilter === 'all' || a.region === regionFilter
        return statusOk && regionOk
      }),
    [statusFilter, regionFilter],
  )

  const agentAnchors = useMemo(
    () => [
      { id: 'agents-guide', label: t('subnav.agents.guide') },
      { id: 'agents-paige', label: t('agents.paige.title') },
      { id: 'agents-grid', label: t('agents.gridTitle') },
    ],
    [t],
  )

  const guideReadingMinutes = useMemo(
    () =>
      estimateReadingMinutes(
        t('agents.how.intro'),
        t('agents.how.step1.body'),
        t('agents.how.step2.body'),
        t('agents.how.step3.body'),
        t('agents.how.step4.body'),
        t('agents.how.footer'),
      ),
    [t],
  )

  const copyDm = async (agent: (typeof AGENTS)[number]) => {
    const stub = buildAgentDmCopyText(agent.id, agent.npub, agent.country)
    try {
      await navigator.clipboard.writeText(stub)
      toast(t('agents.copyDm'), 'success')
    } catch {
      toast(t('agents.copyDm'), 'error')
    }
  }

  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <SeoHead jsonLd={kimiPersonJsonLd()} jsonLdOnly />
      <PageHeader eyebrow={t('agents.eyebrow')} title={t('agents.title')} subtitle={t('agents.sub')} />

      {hasApplicationContext && (
        <Card variant="banner" animate className="mb-6 flex items-start gap-3">
          <Handshake size={18} className="text-nostr-violet shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold text-ink">{t('agents.applicationContextTitle')}</p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              {formatT(t, 'agents.applicationContextBody', { program: applicationProgram ?? '', id: applicationId ?? '' })}
            </p>
            {applicationHash && (
              <code className="block text-[10px] font-mono text-ink-secondary break-all mt-2 opacity-80">
                {applicationHash}
              </code>
            )}
            <Link to="/apply" className="inline-flex text-xs text-mp-btc-text hover:underline mt-2">
              {t('agents.applicationContextBack')} →
            </Link>
          </div>
        </Card>
      )}

      <PageAnchorNav items={agentAnchors} />

      <div id="agents-guide" className="scroll-mt-header">
        <HowItWorksSection
          eyebrow={t('agents.how.eyebrow')}
          title={t('agents.how.title')}
          intro={t('agents.how.intro')}
          footerNote={t('agents.how.footer')}
          readingMinutes={guideReadingMinutes}
          steps={[
            { n: '01', title: t('agents.how.step1.title'), body: t('agents.how.step1.body'), icon: Radio },
            { n: '02', title: t('agents.how.step2.title'), body: t('agents.how.step2.body'), icon: Zap },
            { n: '03', title: t('agents.how.step3.title'), body: t('agents.how.step3.body'), icon: MessageCircle, link: { to: '/vault', label: 'Verify proofs first' } },
            { n: '04', title: t('agents.how.step4.title'), body: t('agents.how.step4.body'), icon: Handshake, link: { to: '/apply', label: 'Open applications' } },
          ]}
        />
      </div>

      <Card variant="banner" animate className="mb-8 !p-6">
        <span className="club-eyebrow block mb-2">{t('agents.nexus.title')}</span>
        <p className="font-body text-sm text-ink-secondary leading-relaxed max-w-3xl">{t('agents.nexus.sub')}</p>
      </Card>

      <div id="agents-paige" className="grid gap-4 md:grid-cols-2 mb-10 scroll-mt-header">
        <div className="space-y-4">
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
          <PaigeChat compact />
        </div>
        <Card variant="elevated" animate delay={0.08} className="!p-5 border-l-4 border-l-btc-orange h-fit">
          <div className="flex items-center gap-2 mb-2">
            <Handshake size={18} className="text-btc-orange" aria-hidden />
            <h3 className="font-display font-semibold text-ink">{t('agents.dealroom.title')}</h3>
          </div>
          <p className="text-sm text-ink-secondary leading-relaxed mb-4">{t('agents.dealroom.body')}</p>
          {distressedGateOpen ? (
            <Link to="/distressed" className="text-xs font-chrome font-medium text-mp-btc-text inline-flex items-center gap-1 hover:underline underline-offset-2">
              {t('agents.dealroom.cta')} <ArrowRight size={12} />
            </Link>
          ) : (
            <p className="text-xs text-ink-muted leading-relaxed">{t('agents.dealroom.gated')}</p>
          )}
        </Card>
      </div>

      <AgentRegionMap />

      <div id="kimi" className="mb-10 max-w-xl scroll-mt-header">
        <AgentCardKimi />
      </div>

      <h2 id="agents-grid" className="font-display font-semibold text-lg text-ink mb-4 scroll-mt-header">
        {t('agents.gridTitle')}
      </h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {STATUS_FILTER_CHIPS.map((chip) => (
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
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="sr-only">{t('agents.filterRegion')}</span>
        {REGION_FILTER_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={regionFilter === chip.id}
            onClick={() => setRegionFilter(chip.id)}
            className={regionFilter === chip.id ? 'chip-active text-xs' : 'chip text-xs'}
          >
            {t(chip.key)}
            <span className="ml-1.5 font-mono text-[10px] opacity-70">{regionCounts[chip.id]}</span>
          </button>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <NostrConnect onLoadingChange={setNostrBusy} />
        <span className="text-xs text-ink-muted">{t('agents.connectHint')}</span>
        <span
          className="text-[10px] font-mono text-ink-muted bg-card-muted/50 border border-mp/50 rounded-chip px-2 py-1"
          title={t('agents.relayHint')}
        >
          {t('agents.relayLabel')}: {primaryRelay}
        </span>
      </div>

      {nostrBusy ? (
        <CardSkeleton count={6} />
      ) : (
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
      )}

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