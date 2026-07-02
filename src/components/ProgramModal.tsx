import { X, ExternalLink, Zap } from 'lucide-react'
import type { Program } from '../types/program'

const TABS = ['Overview', 'Finance', 'Bitcoin', 'Legal', 'Sources'] as const
type Tab = typeof TABS[number]

export function ProgramModal({ program, tab, onTab, onClose }: {
  program: Program
  tab: Tab
  onTab: (t: Tab) => void
  onClose: () => void
}) {
  const proof = program.satohash_proofs?.[0]

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-2xl mr-2">{program.flag ?? '🌍'}</span>
            <h2 className="text-xl font-display font-semibold inline">{program.name}</h2>
            <p className="text-xs text-sovereign-silver">{program.region} • {program.category.replace(/_/g, ' ')}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-sovereign-silver hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
          {TABS.map(t => (
            <button key={t} type="button" onClick={() => onTab(t)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border ${tab === t ? 'border-btc-orange text-btc-orange bg-btc-orange/10' : 'border-white/15 text-sovereign-silver'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div className="space-y-3 text-sm">
            <p>{program.details}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-lg p-2">Sovereignty: <strong>{program.sovereignty_score}/10</strong></div>
              <div className="bg-white/5 rounded-lg p-2">Stacking: <strong>{program.stacking_synergy}</strong></div>
              <div className="bg-white/5 rounded-lg p-2">Risk: <strong>{program.risk_level}</strong></div>
              <div className="bg-white/5 rounded-lg p-2">Lightning: <strong>{program.lightning_ready ? 'Yes' : 'No'}</strong></div>
            </div>
          </div>
        )}
        {tab === 'Finance' && (
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-sovereign-silver">Min investment</dt><dd>${(program.finance.min_investment_usd ?? 0).toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-sovereign-silver">Typical</dt><dd>${(program.finance.typical_investment_usd ?? 0).toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-sovereign-silver">Gov fees</dt><dd>${(program.finance.gov_fees_usd ?? 0).toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-sovereign-silver">Processing</dt><dd>{program.finance.processing_time_months ?? '—'} months</dd></div>
            <div><dt className="text-sovereign-silver">Tax benefits</dt><dd className="mt-1">{program.finance.tax_benefits}</dd></div>
          </dl>
        )}
        {tab === 'Bitcoin' && (
          <div className="text-sm space-y-3">
            <p>{program.bitcoin_integration}</p>
            <p className="text-btc-orange">{program.finance.bitcoin_specific}</p>
            <div className="flex items-center gap-2"><Zap size={14} /> Score: {program.finance.crypto_friendly_score}/10</div>
            {proof && (
              <a href={proof.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-btc-orange hover:underline flex items-center gap-1">
                Verify block #{proof.block_height} <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
        {tab === 'Legal' && <p className="text-sm text-sovereign-silver">Status: {program.status}. Last checked {program.last_checked}. Informational only — not legal advice.</p>}
        {tab === 'Sources' && (
          <ul className="text-sm space-y-1">{program.sources?.map(s => <li key={s} className="text-sovereign-silver">• {s}</li>)}</ul>
        )}
      </div>
    </div>
  )
}

export type { Tab as ProgramModalTab }