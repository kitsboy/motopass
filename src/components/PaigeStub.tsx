import { Bot } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Paige AI — UI stub only per plan non-goals */
export function PaigeStub() {
  return (
    <div className="card border-nostr-violet/25 bg-nostr-violet-soft">
      <div className="flex items-center gap-2 mb-2">
        <Bot size={16} className="text-nostr-violet" />
        <span className="font-semibold text-sm text-ink">Paige AI</span>
        <span className="text-[10px] font-mono uppercase tracking-wide text-ink-muted">Coming Phase 2</span>
      </div>
      <p className="text-xs text-ink-secondary mb-3 leading-relaxed">
        Proactive jurisdiction concierge — alerts, stacking tips, policy change detection.
        See <Link to="/blog" className="text-nostr-violet font-medium hover:underline">docs/PAIGE-AI.md</Link> for spec.
      </p>
      <input
        disabled
        placeholder="Ask Paige about your stack…"
        className="w-full rounded-mp-md border border-mp bg-card px-3 py-2 text-sm text-ink-muted placeholder:text-ink-muted"
      />
    </div>
  )
}