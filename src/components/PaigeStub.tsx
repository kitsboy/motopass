import { Bot } from 'lucide-react'

const PAIGE_DOCS_URL = 'https://github.com/kitsboy/motopass/blob/main/docs/PAIGE-AI.md'

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
        See{' '}
        <a
          href={PAIGE_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-nostr-violet font-medium hover:underline"
        >
          docs/PAIGE-AI.md
        </a>{' '}
        for spec.
      </p>
      <input
        disabled
        aria-disabled="true"
        aria-describedby="paige-phase2-desc"
        aria-label="Paige AI concierge — coming in Phase 2"
        placeholder="Ask Paige about your stack…"
        className="w-full rounded-mp-md border border-mp bg-card px-3 py-2 text-sm text-ink-muted placeholder:text-ink-muted"
      />
      <p id="paige-phase2-desc" className="sr-only">Paige AI is not available yet. See docs for the Phase 2 spec.</p>
    </div>
  )
}