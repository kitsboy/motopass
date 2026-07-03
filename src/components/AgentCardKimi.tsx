import { MessageCircle, Zap } from 'lucide-react'
import { TiltCard } from './beui/TiltCard'
import { AnimatedBadge } from './beui/AnimatedBadge'

export function AgentCardKimi() {
  return (
    <TiltCard className="rounded-mp-xl">
      <div className="card-elevated border-nostr-violet/15 bg-gradient-to-br from-card to-nostr-violet-soft/30 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <div className="relative shrink-0">
            <img
              src="/images/kimi.jpg"
              alt="Kimi — MotoPass liaison agent"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-mp-lg object-cover border-2 border-nostr-violet/25 shadow-card"
            />
            <AnimatedBadge status="success" className="absolute -bottom-2 -right-2">
              Online
            </AnimatedBadge>
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="section-label mb-1">YOUR LIAISON AGENT</div>
            <h3 className="text-xl font-display font-semibold text-ink">Kimi</h3>
            <p className="text-xs text-ink-muted mt-1">M4 HERMES · Strategic orchestrator · Give A Bit</p>
            <p className="text-sm text-ink-secondary mt-3 leading-relaxed">
              Kimi coordinates country liaison agents, tracks your application progress, and connects you with passport offices via Nostr.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <span className="text-[10px] font-mono text-nostr-violet bg-nostr-violet-soft border border-nostr-violet/20 rounded-full px-3 py-1 flex items-center gap-1">
                <Zap size={10} /> npub1kimi…motopass
              </span>
              <a
                href="https://nostr.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm inline-flex items-center gap-2 border border-nostr-violet/30 text-nostr-violet hover:bg-nostr-violet-soft rounded-full px-4 py-1.5 transition-colors font-medium"
              >
                <MessageCircle size={14} /> Message on Nostr
              </a>
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  )
}