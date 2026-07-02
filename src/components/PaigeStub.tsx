import { Bot } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Paige AI — UI stub only per plan non-goals */
export function PaigeStub() {
  return (
    <div className="card border-purple-500/20 bg-purple-500/5">
      <div className="flex items-center gap-2 mb-2">
        <Bot size={16} className="text-purple-400" />
        <span className="font-semibold text-sm">Paige AI</span>
        <span className="text-[10px] text-sovereign-silver">Coming Phase 2</span>
      </div>
      <p className="text-xs text-sovereign-silver mb-3">
        Proactive jurisdiction concierge — alerts, stacking tips, policy change detection.
        See <Link to="/blog" className="text-purple-300 hover:underline">docs/PAIGE-AI.md</Link> for spec.
      </p>
      <input disabled placeholder="Ask Paige about your stack…" className="w-full bg-sovereign-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm opacity-50" />
    </div>
  )
}