import { useState } from 'react'
import { Shield } from 'lucide-react'
import type { DistressedListing } from '../../types/distressedListing'
import { buildEscrowPsbtStub } from '../../lib/escrow/psbtEscrowBuilder'

type Props = { listing: DistressedListing }

export function EscrowBuilder({ listing }: Props) {
  const [result, setResult] = useState<ReturnType<typeof buildEscrowPsbtStub> | null>(null)

  return (
    <div className="rounded-mp-md border border-mp-border bg-mp-section p-4">
      <h4 className="text-xs font-semibold text-ink flex items-center gap-2 mb-2">
        <Shield size={14} className="text-btc-orange" />
        BTC escrow (signet template)
      </h4>
      <p className="text-[11px] text-ink-muted mb-3">
        Non-custodial 2-of-3 outline — buyer · seller · arbiter. Template only pre-launch.
      </p>
      <button
        type="button"
        className="btn-secondary text-xs"
        onClick={() => setResult(buildEscrowPsbtStub(listing))}
      >
        Generate PSBT template
      </button>
      {result && (
        <div className="mt-3 space-y-1">
          {result.warnings.map(w => (
            <p key={w} className="text-[10px] text-status-amber font-mono">{w}</p>
          ))}
          <pre className="text-[9px] font-mono text-ink-muted break-all bg-mp-card-muted p-2 rounded border border-mp-border max-h-24 overflow-auto">
            {result.psbt_base64.slice(0, 120)}…
          </pre>
        </div>
      )}
    </div>
  )
}