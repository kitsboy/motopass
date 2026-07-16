import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ExternalLink, X } from 'lucide-react'
import { Card } from '../ui/Card'
import { dismissPaigeEnforcement, isPaigeEnforcementDismissed } from '../../lib/paigeEnforcementDismiss'

export function PaigeEnforcementCard() {
  const [dismissed, setDismissed] = useState(() => isPaigeEnforcementDismissed())

  if (dismissed) return null

  const handleDismiss = () => {
    dismissPaigeEnforcement()
    setDismissed(true)
  }

  return (
    <Card variant="banner" className="!p-5 border-l-4 border-l-nostr-violet relative">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-ink-muted hover:text-ink-secondary hover:bg-card-muted/60"
        aria-label="Dismiss Paige proof policy notice"
      >
        <X size={14} aria-hidden />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nostr-violet-soft border border-nostr-violet/25 text-nostr-violet">
          <ShieldAlert size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-ink text-sm">Paige proof policy — enforced</h3>
          <p className="mt-1.5 text-xs text-ink-secondary leading-relaxed font-body">
            Every Paige answer cites a Satohash proof or prefixes claims{' '}
            <span className="font-mono text-status-amber">[unverified]</span>. Unstamped program depth is research
            stubs only — verify on Bitcoin before capital moves.
          </p>
          <ul className="mt-3 space-y-1 text-[11px] font-mono text-ink-muted">
            <li className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-mp-proof shrink-0" />
              Verified → block height + Satohash URL cited
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-amber shrink-0" />
              Unverified → explicit warning, no implied endorsement
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/vault" className="btn-secondary text-xs !py-1.5 !px-3">
              Open Vault
            </Link>
            <a
              href="https://satohash.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-chrome text-mp-btc-text inline-flex items-center gap-1 hover:underline"
            >
              Satohash.io <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </Card>
  )
}