import { X, ExternalLink, Zap } from 'lucide-react'
import type { Program } from '../types/program'

const TABS = ['Overview', 'Finance', 'Bitcoin', 'Legal', 'Sources'] as const
type Tab = (typeof TABS)[number]

export function ProgramModal({ program, tab, onTab, onClose }: {
  program: Program
  tab: Tab
  onTab: (t: Tab) => void
  onClose: () => void
}) {
  const proof = program.satohash_proofs?.[0]

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-mp-xl sm:rounded-mp-xl shadow-card-hover border-mp-strong/30" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-5 pb-4 border-b border-mp">
          <div>
            <span className="text-2xl mr-2">{program.flag ?? '🌍'}</span>
            <h2 className="text-xl font-display font-semibold inline text-ink">{program.name}</h2>
            <p className="text-xs text-ink-muted capitalize mt-1">{program.region} · {program.category.replace(/_/g, ' ')}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-mp-md text-ink-muted hover:bg-section hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto mb-5 pb-1">
          {TABS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => onTab(t)}
              className={tab === t ? 'chip-active' : 'chip'}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div className="space-y-4 text-sm text-ink-secondary">
            <p className="leading-relaxed">{program.details}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Sovereignty', `${program.sovereignty_score}/10`],
                ['Stacking', program.stacking_synergy],
                ['Risk', program.risk_level],
                ['Lightning', program.lightning_ready ? 'Yes' : 'No'],
              ].map(([k, v]) => (
                <div key={k} className="card-muted font-medium text-ink">
                  <span className="text-ink-muted block text-[10px] uppercase tracking-wide mb-0.5">{k}</span>
                  {v}
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'Finance' && (
          <dl className="text-sm space-y-3">
            {[
              ['Min investment', `$${(program.finance.min_investment_usd ?? 0).toLocaleString()}`],
              ['Typical', `$${(program.finance.typical_investment_usd ?? 0).toLocaleString()}`],
              ['Gov fees', `$${(program.finance.gov_fees_usd ?? 0).toLocaleString()}`],
              ['Processing', `${program.finance.processing_time_months ?? '—'} months`],
            ].map(([dt, dd]) => (
              <div key={dt} className="flex justify-between border-b border-mp/60 pb-2">
                <dt className="text-ink-muted">{dt}</dt>
                <dd className="font-mono text-ink font-medium">{dd}</dd>
              </div>
            ))}
            <div>
              <dt className="text-ink-muted mb-1">Tax benefits</dt>
              <dd className="text-ink-secondary leading-relaxed">{program.finance.tax_benefits}</dd>
            </div>
          </dl>
        )}
        {tab === 'Bitcoin' && (
          <div className="text-sm space-y-3 text-ink-secondary">
            <p className="leading-relaxed">{program.bitcoin_integration}</p>
            <p className="text-btc-orange-deep font-medium">{program.finance.bitcoin_specific}</p>
            <div className="flex items-center gap-2 text-ink">
              <Zap size={14} className="text-btc-orange" /> Score: {program.finance.crypto_friendly_score}/10
            </div>
            {proof && (
              <a href={proof.proof_url} target="_blank" rel="noopener noreferrer" className="proof-badge inline-flex items-center gap-1 hover:bg-emerald-100">
                Verify block #{proof.block_height} <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
        {tab === 'Legal' && (
          <p className="text-sm text-ink-secondary leading-relaxed card-muted">
            Status: <strong className="text-ink">{program.status}</strong>. Last checked {program.last_checked}. Informational only — not legal advice.
          </p>
        )}
        {tab === 'Sources' && (
          <ul className="text-sm space-y-2">
            {program.sources?.map(s => (
              <li key={s} className="text-ink-secondary flex gap-2">
                <span className="text-btc-orange">•</span> {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export type { Tab as ProgramModalTab }