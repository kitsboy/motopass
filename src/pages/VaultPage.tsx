import { useState } from 'react'
import { ExternalLink, Shield } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { toCinematicProgram } from '../lib/programAdapter'
import { buildProgramUpdateEvent, serializeNostrEvent } from '../lib/nostrEvents'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { PageHeader } from '../components/ui/PageHeader'
import { ProofBadge } from '../components/ui/ProofBadge'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'

type VaultFilter = 'all' | 'verified' | 'demo'

export function VaultPage() {
  const { t } = useI18n()
  const { programs, loading, error } = usePrograms()
  const [nostrEvent, setNostrEvent] = useState('')
  const [filter, setFilter] = useState<VaultFilter>('all')

  const stamped = programs
    .filter(p => p.satohash_proofs?.length)
    .map(p => ({ program: p, cinematic: toCinematicProgram(p) }))
    .sort((a, b) => (b.program.last_checked ?? '').localeCompare(a.program.last_checked ?? ''))

  const displayed = stamped.filter(({ cinematic }) => {
    if (filter === 'verified') return cinematic.proofStatus === 'verified'
    if (filter === 'demo') return cinematic.proofStatus === 'demo'
    return true
  })

  const verifiedCount = stamped.filter(s => s.cinematic.proofStatus === 'verified').length
  const demoCount = stamped.filter(s => s.cinematic.proofStatus === 'demo').length

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <PageHeader
        eyebrow={t('vault.eyebrow')}
        title={t('vault.title')}
        subtitle={t('vault.subtitle')}
      />

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <CardSkeleton />}
      {!loading && !error && (
        <div className="space-y-3">
          {stamped.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {(['all', 'verified', 'demo'] as VaultFilter[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-chip border px-2.5 py-1 text-xs font-chrome transition-colors ${
                    filter === f ? 'border-btc-orange/35 bg-btc-orange-soft text-mp-btc-text' : 'border-mp-border text-ink-muted hover:border-mp-strong'
                  }`}
                >
                  {f === 'all' ? t('vault.filterAll') : f === 'verified' ? t('vault.filterVerified') : t('vault.filterDemo')}
                </button>
              ))}
            </div>
          )}
          {stamped.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 text-xs text-mp-ink-secondary">
              <span className="rounded-chip border border-mp-border bg-mp-card-muted px-2.5 py-1">
                {formatT(t, 'vault.anchored', { count: stamped.length })}
              </span>
              {verifiedCount > 0 && (
                <span className="rounded-chip border border-mp-proof/30 bg-mp-proof-soft px-2.5 py-1 text-mp-proof">
                  {formatT(t, 'vault.verified', { count: verifiedCount })}
                </span>
              )}
              {demoCount > 0 && (
                <span className="rounded-chip border border-mp-border-strong bg-mp-section px-2.5 py-1">
                  {formatT(t, 'vault.demoAnchors', { count: demoCount })}
                </span>
              )}
            </div>
          )}

          {displayed.map(({ program: p, cinematic }) => {
            const proof = p.satohash_proofs![0]
            const isDemo = cinematic.proofStatus === 'demo'
            return (
              <div
                key={p.id}
                className={`rounded-card border bg-mp-card p-6 shadow-mp-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-[box-shadow,border-color] duration-base hover:shadow-mp-2 ${
                  isDemo ? 'border-mp-border-strong' : 'border-mp-proof/25 hover:border-mp-proof/40'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="font-display font-semibold text-ink">{p.flag} {p.name}</div>
                    <ProofBadge status={cinematic.proofStatus} compact txHint={cinematic.proofRef} />
                  </div>
                  <div className="text-xs text-ink-muted mt-1 font-mono">
                    Block #{proof.block_height} · {p.last_checked}
                    {isDemo && (
                      <span className="ml-2 text-mp-ink-tertiary">· placeholder hash in seed data</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {proof.proof_url && (
                    <a
                      href={proof.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs !py-1.5 !px-3"
                    >
                      Satohash <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setNostrEvent(
                        serializeNostrEvent(
                          buildProgramUpdateEvent(
                            p.name,
                            isDemo ? 'Demo anchor (seed data)' : 'Data verified',
                            proof.proof_url,
                          ),
                        ),
                      )
                    }
                    className="chip text-xs !text-nostr-violet !border-nostr-violet/30 hover:!bg-nostr-violet-soft"
                  >
                    Nostr Kind 30078
                  </button>
                </div>
              </div>
            )
          })}
          {stamped.length === 0 && (
            <div className="text-center py-12 rounded-card border border-mp-border bg-mp-card-muted text-mp-ink-tertiary">
              {t('vault.empty')}
            </div>
          )}
        </div>
      )}

      {nostrEvent && (
        <div className="rounded-card border border-mp-border bg-mp-card p-6 shadow-mp-1 mt-8">
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <Shield size={14} className="text-btc-orange" /> Nostr event stub
          </h3>
          <pre className="text-[10px] font-mono text-ink-secondary overflow-x-auto whitespace-pre-wrap bg-mp-card-muted rounded-mp-md p-4 border border-mp-border">
            {nostrEvent}
          </pre>
        </div>
      )}
    </div>
  )
}