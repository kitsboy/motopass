import { Globe, Zap } from 'lucide-react'
import type { Program } from '../types/program'

export function ProgramCard({ program, onClick }: { program: Program; onClick?: () => void }) {
  const acquired = program.status.toLowerCase().includes('acquired')

  return (
    <button
      type="button"
      onClick={onClick}
      className="program-card group text-left w-full"
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-base sm:text-lg tracking-tight group-hover:text-btc-orange transition-colors truncate">
            {program.name}
          </div>
          <div className="text-[11px] text-sovereign-silver truncate">
            {program.region} • {program.category.replace(/_/g, ' ')}
          </div>
        </div>
        <div className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${acquired ? 'border-status-green text-status-green' : 'border-status-amber text-status-amber'}`}>
          {program.status.split(' - ')[0]}
        </div>
      </div>

      <p className="text-sm text-sovereign-silver line-clamp-2 mb-3">{program.details}</p>

      <div className="flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-px bg-white/5 rounded whitespace-nowrap">
            Min ~${(program.finance.min_investment_usd || 0).toLocaleString()}
          </span>
          {program.finance.crypto_friendly_score != null && (
            <span className="px-2 py-px bg-white/5 rounded flex items-center gap-1">
              <Zap size={11} /> {program.finance.crypto_friendly_score}/10
            </span>
          )}
        </div>
        <span className="proof-badge flex items-center gap-1 shrink-0">
          <Globe size={11} /> VERIFY
        </span>
      </div>
    </button>
  )
}