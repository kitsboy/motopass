import { useState } from 'react'
import { ExternalLink, Shield } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { buildProgramUpdateEvent, serializeNostrEvent } from '../lib/nostrEvents'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { PageHeader } from '../components/ui/PageHeader'

export function VaultPage() {
  const { programs, loading } = usePrograms()
  const [nostrEvent, setNostrEvent] = useState('')

  const stamped = programs.filter(p => p.satohash_proofs?.length)

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="RESEARCH VAULT"
        title="Timestamp proofs"
        subtitle="Satohash-anchored program data with optional Nostr Kind 30078 stubs."
      />

      {loading && <CardSkeleton />}
      {!loading && (
        <div className="space-y-3">
          {stamped.map(p => {
            const proof = p.satohash_proofs![0]
            return (
              <div key={p.id} className="card-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-display font-semibold text-ink">{p.flag} {p.name}</div>
                  <div className="text-xs text-ink-muted mt-1 font-mono">Block #{proof.block_height} · {p.last_checked}</div>
                </div>
                <div className="flex gap-2">
                  {proof.proof_url && (
                    <a href={proof.proof_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs !py-1.5 !px-3">
                      Satohash <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setNostrEvent(serializeNostrEvent(buildProgramUpdateEvent(p.name, 'Data verified', proof.proof_url)))}
                    className="chip text-xs !text-nostr-violet !border-nostr-violet/30 hover:!bg-nostr-violet-soft"
                  >
                    Nostr Kind 30078
                  </button>
                </div>
              </div>
            )
          })}
          {stamped.length === 0 && <div className="card-muted text-center py-12 text-ink-muted">No stamped proofs yet.</div>}
        </div>
      )}

      {nostrEvent && (
        <div className="card mt-8">
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><Shield size={14} className="text-btc-orange" /> Nostr event stub</h3>
          <pre className="text-[10px] font-mono text-ink-secondary overflow-x-auto whitespace-pre-wrap bg-section rounded-mp-md p-4 border border-mp">{nostrEvent}</pre>
        </div>
      )}
    </div>
  )
}