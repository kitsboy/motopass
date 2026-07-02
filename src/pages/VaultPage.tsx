import { useState } from 'react'
import { ExternalLink, Shield } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { buildProgramUpdateEvent, serializeNostrEvent } from '../lib/nostrEvents'
import { CardSkeleton } from '../components/LoadingSkeleton'

export function VaultPage() {
  const { programs, loading } = usePrograms()
  const [nostrEvent, setNostrEvent] = useState('')

  const stamped = programs.filter(p => p.satohash_proofs?.length)

  const generateNostr = (name: string) => {
    const p = programs.find(x => x.name === name)
    const event = buildProgramUpdateEvent(name, 'Data verified', p?.satohash_proofs?.[0]?.proof_url)
    setNostrEvent(serializeNostrEvent(event))
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <div className="section-label mb-1 flex items-center gap-2"><Shield size={12} /> RESEARCH VAULT</div>
      <h1 className="text-2xl sm:text-3xl font-display font-semibold mb-6">Timestamp proofs</h1>

      {loading && <CardSkeleton />}
      {!loading && (
        <div className="space-y-3">
          {stamped.map(p => {
            const proof = p.satohash_proofs![0]
            return (
              <div key={p.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{p.flag} {p.name}</div>
                  <div className="text-xs text-sovereign-silver">Block #{proof.block_height} • {p.last_checked}</div>
                </div>
                <div className="flex gap-2">
                  {proof.proof_url && (
                    <a href={proof.proof_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex items-center gap-1">
                      Satohash <ExternalLink size={12} />
                    </a>
                  )}
                  <button type="button" onClick={() => generateNostr(p.name)} className="text-xs border border-purple-500/40 text-purple-300 rounded-full px-3 py-1.5">
                    Nostr Kind 30078
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {nostrEvent && (
        <div className="card mt-6">
          <h3 className="text-sm font-semibold mb-2">Nostr event stub</h3>
          <pre className="text-[10px] font-mono text-sovereign-silver overflow-x-auto whitespace-pre-wrap">{nostrEvent}</pre>
        </div>
      )}
    </div>
  )
}