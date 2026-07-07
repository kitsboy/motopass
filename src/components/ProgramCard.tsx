import { Globe, Zap } from 'lucide-react'
import type { Program } from '../types/program'

export function ProgramCard({ program, onClick }: { program: Program; onClick?: () => void }) {
  const acquired = program.status.toLowerCase().includes('acquired')

  return (
    <button type="button" onClick={onClick} className="program-card group text-left w-full">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="min-w-0">
          <div className="font-display font-semibold text-base sm:text-lg tracking-tight text-ink group-hover:text-accent transition-colors truncate">
            {program.flag && <span className="mr-1.5">{program.flag}</span>}
            {program.name}
          </div>
          <div className="text-[11px] text-ink-muted truncate capitalize">
            {program.region} · {program.category.replace(/_/g, ' ')}
          </div>
        </div>
        <div
          className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${
            acquired ? 'border-mp-proof/30 bg-mp-proof-soft text-mp-proof' : 'border-mp-ochre/30 bg-mp-btc-soft text-mp-ochre'
          }`}
        >
          {program.status.split(' - ')[0]}
        </div>
      </div>

      <p className="text-sm text-ink-secondary line-clamp-2 mb-4 leading-relaxed">{program.details}</p>

      <div className="flex items-center justify-between text-xs gap-2 pt-3 border-t border-mp/80">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2.5 py-1 bg-section rounded-mp-sm text-ink-secondary font-medium whitespace-nowrap">
            Min ~${(program.finance.min_investment_usd || 0).toLocaleString()}
          </span>
          {program.finance.crypto_friendly_score != null && (
            <span className="px-2.5 py-1 bg-btc-orange-soft rounded-mp-sm flex items-center gap-1 text-btc-orange-deep font-medium">
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