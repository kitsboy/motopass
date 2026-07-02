import { Bot, Zap, MessageCircle } from 'lucide-react'
import { NostrConnect } from '../components/NostrConnect'
import { useI18n } from '../i18n/I18nContext'

const AGENTS = [
  { country: 'Uruguay', region: 'South America', npub: 'npub1motopass…uy', status: 'Active', focus: 'RBI territorial tax, crypto-friendly residency' },
  { country: 'El Salvador', region: 'Central America', npub: 'npub1motopass…sv', status: 'Active', focus: 'Bitcoin legal tender pathways, Lightning pilots' },
  { country: 'UAE', region: 'Middle East', npub: 'npub1motopass…ae', status: 'Beta', focus: 'Golden visa, free zone investor routes' },
  { country: 'Singapore', region: 'Asia', npub: 'npub1motopass…sg', status: 'Beta', focus: 'Family office, tech investor residency' },
  { country: 'Portugal', region: 'Europe', npub: 'npub1motopass…pt', status: 'Coming', focus: 'D7/D8 pathways, policy monitoring' },
  { country: 'Georgia', region: 'Europe', npub: 'npub1motopass…ge', status: 'Coming', focus: 'Low-cost residency, crypto business setup' },
]

export function AgentsPage() {
  const { t } = useI18n()

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="section-label mb-1 flex items-center gap-2"><Bot size={12} /> LIAISON AGENTS</div>
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-2">{t('agents.title')}</h1>
      <p className="text-sm text-sovereign-silver mb-6 max-w-2xl">{t('agents.sub')}</p>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <NostrConnect />
        <span className="text-xs text-sovereign-silver">Connect Nostr to message agents directly</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map(a => (
          <div key={a.country} className="card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-semibold text-lg">{a.country}</h2>
                <p className="text-xs text-sovereign-silver">{a.region}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                a.status === 'Active' ? 'border-status-green text-status-green' :
                a.status === 'Beta' ? 'border-status-amber text-status-amber' :
                'border-white/20 text-sovereign-silver'
              }`}>{a.status}</span>
            </div>
            <p className="text-sm text-sovereign-silver mb-4">{a.focus}</p>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-500/10 rounded-lg px-3 py-2 mb-3">
              <Zap size={12} /> {a.npub}
            </div>
            <button type="button" className="w-full text-sm flex items-center justify-center gap-2 border border-white/15 rounded-full py-2 hover:border-purple-400 hover:text-purple-300 transition-colors">
              <MessageCircle size={14} /> Message via Nostr
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-sovereign-silver mt-8 text-center max-w-xl mx-auto">
        Liaison agents assist verified Nostr users with official passport office conversations.
        All agent guidance is informational — not legal advice. Stamped interactions anchor to Satohash.
      </p>
    </div>
  )
}