import { Zap, MessageCircle } from 'lucide-react'
import { NostrConnect } from '../components/NostrConnect'
import { BtcMapReportVenue } from '../components/btcmap/BtcMapReportVenue'
import { AgentCardKimi } from '../components/AgentCardKimi'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'
import type { TranslationKey } from '../i18n/translations'

type AgentStatus = 'active' | 'beta' | 'coming'

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

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow={t('agents.eyebrow')} title={t('agents.title')} subtitle={t('agents.sub')} />

      <div className="mb-10 max-w-xl">
        <AgentCardKimi />
      </div>

      <h2 className="font-display font-semibold text-lg text-ink mb-4">{t('agents.gridTitle')}</h2>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <NostrConnect />
        <span className="text-xs text-ink-muted">{t('agents.connectHint')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {AGENTS.map(a => (
          <div key={a.id} className="card-elevated">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-display font-semibold text-lg text-ink">{a.country}</h2>
                <p className="text-xs text-ink-muted">{t(a.regionKey)}</p>
              </div>
              <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${statusClass(a.status)}`}>
                {t(STATUS_KEYS[a.status])}
              </span>
            </div>
            <p className="text-sm text-ink-secondary mb-4 leading-relaxed">{t(a.focusKey)}</p>
            <div className="flex items-center gap-2 text-xs font-mono text-nostr-violet bg-nostr-violet-soft rounded-mp-md px-3 py-2 mb-4 border border-nostr-violet/15">
              <Zap size={12} /> {a.npub}
            </div>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title={t('agents.messageSoon')}
              className="btn-secondary w-full text-sm !py-2 opacity-50 cursor-not-allowed"
            >
              <MessageCircle size={14} /> {t('agents.message')}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 max-w-xl mx-auto">
        <BtcMapReportVenue />
      </div>

      <p className="text-xs text-ink-muted mt-6 text-center max-w-xl mx-auto leading-relaxed">
        {t('agents.disclaimer')}
      </p>
    </div>
  )
}