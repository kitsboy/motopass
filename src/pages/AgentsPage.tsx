import { Bot, Zap, MessageCircle } from 'lucide-react'
import { NostrConnect } from '../components/NostrConnect'
import { AgentCardKimi } from '../components/AgentCardKimi'
import { useI18n } from '../i18n/I18nContext'
import { PageHeader } from '../components/ui/PageHeader'

const AGENTS = [
  { country: 'Uruguay', region: 'South America', npub: 'npub1motopass…uy', status: 'Active', focus: 'RBI territorial tax, crypto-friendly residency' },
  { country: 'El Salvador', region: 'Central America', npub: 'npub1motopass…sv', status: 'Active', focus: 'Bitcoin legal tender pathways, Lightning pilots' },
  { country: 'UAE', region: 'Middle East', npub: 'npub1motopass…ae', status: 'Beta', focus: 'Golden visa, free zone investor routes' },
  { country: 'Singapore', region: 'Asia', npub: 'npub1motopass…sg', status: 'Beta', focus: 'Family office, tech investor residency' },
  { country: 'Portugal', region: 'Europe', npub: 'npub1motopass…pt', status: 'Coming', focus: 'D7/D8 pathways, policy monitoring' },
  { country: 'Georgia', region: 'Europe', npub: 'npub1motopass…ge', status: 'Coming', focus: 'Low-cost residency, crypto business setup' },
]

const statusClass = (s: string) =>
  s === 'Active' ? 'border-emerald-200 bg-emerald-50 text-status-green' :
  s === 'Beta' ? 'border-amber-200 bg-amber-50 text-status-amber' :
  'border-mp bg-card-muted text-ink-muted'

export function AgentsPage() {
  const { t } = useI18n()

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader eyebrow="LIAISON AGENTS" title={t('agents.title')} subtitle={t('agents.sub')} />

      <div className="mb-10 max-w-xl">
        <AgentCardKimi />
      </div>

      <h2 className="font-display font-semibold text-lg text-ink mb-4">Country liaison agents (via Kimi)</h2>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <NostrConnect />
        <span className="text-xs text-ink-muted">Connect Nostr — Kimi routes you to the right country agent</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {AGENTS.map(a => (
          <div key={a.country} className="card-elevated">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-display font-semibold text-lg text-ink">{a.country}</h2>
                <p className="text-xs text-ink-muted">{a.region}</p>
              </div>
              <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${statusClass(a.status)}`}>{a.status}</span>
            </div>
            <p className="text-sm text-ink-secondary mb-4 leading-relaxed">{a.focus}</p>
            <div className="flex items-center gap-2 text-xs font-mono text-nostr-violet bg-nostr-violet-soft rounded-mp-md px-3 py-2 mb-4 border border-nostr-violet/15">
              <Zap size={12} /> {a.npub}
            </div>
            <button type="button" className="btn-secondary w-full text-sm !py-2">
              <MessageCircle size={14} /> Message via Nostr
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-muted mt-10 text-center max-w-xl mx-auto leading-relaxed">
        Liaison agents assist verified Nostr users with official passport office conversations.
        All agent guidance is informational — not legal advice. Stamped interactions anchor to Satohash.
      </p>
    </div>
  )
}