import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Shield, Copy, Check, Upload, FileCheck, Loader2 } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { toCinematicProgram } from '../lib/programAdapter'
import { buildProgramUpdateEvent, serializeNostrEvent } from '../lib/nostrEvents'
import { verifyHashPaste, verifyOtsInBrowser, satohashVerifyUrl } from '../lib/seal/vaultVerify'
import { RowSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassCard } from '../components/ui/GlassCard'
import { ProofBadge } from '../components/ui/ProofBadge'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import type { VerifyResult } from '../types/proof'

type VaultFilter = 'all' | 'verified' | 'demo'

function proofHash(proof: { content_hash?: string; proof_url?: string }): string {
  if (proof.content_hash) return proof.content_hash
  const tail = proof.proof_url?.replace(/\/$/, '').split('/').pop() ?? ''
  return tail
}

export function VaultPage() {
  const { t } = useI18n()
  const { programs, loading, error } = usePrograms()
  const [nostrEvent, setNostrEvent] = useState('')
  const [filter, setFilter] = useState<VaultFilter>('all')
  const [copied, setCopied] = useState(false)
  const [hashInput, setHashInput] = useState('')
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
  const otsCount = stamped.filter(s => s.program.satohash_proofs?.[0]?.ots_path).length

  async function handleHashVerify() {
    setVerifyBusy(true)
    try {
      setVerifyResult(await verifyHashPaste(hashInput))
    } finally {
      setVerifyBusy(false)
    }
  }

  async function handleOtsUpload(file: File) {
    setSelectedFile(file.name)
    const hash = hashInput.trim() || proofHash(stamped[0]?.program.satohash_proofs?.[0] ?? {})
    setVerifyBusy(true)
    try {
      setVerifyResult(await verifyOtsInBrowser(file, hash))
    } finally {
      setVerifyBusy(false)
    }
  }

  function applyProgramProof(hash: string) {
    setHashInput(hash)
    setVerifyResult(null)
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
    document.getElementById('vault-verify-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    void verifyHashPaste(hash).then(setVerifyResult)
  }

  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <PageHeader eyebrow={t('vault.eyebrow')} title={t('vault.title')} subtitle={t('vault.subtitle')} />

      <GlassCard variant="proof" animate className="mb-8" aria-labelledby="vault-verify-heading">
        <h2 id="vault-verify-heading" className="font-chrome text-sm font-semibold text-ink flex items-center gap-2 mb-3">
          <FileCheck size={16} className="text-btc-orange" aria-hidden />
          Verify OTS proof
        </h2>
        <p className="font-body text-xs text-ink-muted mb-4 leading-relaxed">
          Paste a content hash, upload a <code className="font-mono text-mp-btc-text">.ots</code> file, or select a program below.
        </p>

        <label htmlFor="vault-hash" className="sr-only">
          Content hash
        </label>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            id="vault-hash"
            type="text"
            value={hashInput}
            onChange={e => setHashInput(e.target.value)}
            placeholder="SHA-256 content hash (64 hex)"
            className="input-field flex-1 font-mono text-xs"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={handleHashVerify}
            disabled={verifyBusy || !hashInput.trim()}
            className="btn-primary text-xs !py-2 shrink-0 min-w-[7rem]"
          >
            {verifyBusy ? <Loader2 size={14} className="animate-spin" /> : 'Verify hash'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".ots,application/octet-stream"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) void handleOtsUpload(f)
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={verifyBusy}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <Upload size={14} aria-hidden />
            Upload .ots
          </button>
          {selectedFile && (
            <span className="text-xs font-mono text-ink-muted truncate max-w-[200px] opacity-75">{selectedFile}</span>
          )}
        </div>

        {verifyResult && (
          <div
            role="status"
            className={`mt-4 rounded-mp-md border px-4 py-3 text-xs font-mono backdrop-blur-sm ${
              verifyResult.verified
                ? 'border-mp-proof/40 bg-mp-proof/10 text-mp-proof'
                : 'border-status-amber/40 bg-status-amber/10 text-status-amber'
            }`}
          >
            <div>{verifyResult.message}</div>
            <div className="mt-1 text-ink-muted opacity-80">
              mode: {verifyResult.mode}
              {verifyResult.hash && /^[a-f0-9]{64}$/.test(verifyResult.hash) && (
                <>
                  {' · '}
                  <a
                    href={satohashVerifyUrl(verifyResult.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-mp-btc-text"
                  >
                    Satohash ↗
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <RowSkeleton count={5} />}
      {!loading && !error && (
        <div className="space-y-3">
          {stamped.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {(['all', 'verified', 'demo'] as VaultFilter[]).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-chip border px-2.5 py-1 text-xs font-chrome transition-all duration-fast ${
                      filter === f
                        ? 'border-btc-orange/35 bg-btc-orange-soft/60 text-mp-btc-text shadow-mp-1'
                        : 'border-mp/70 text-ink-muted hover:border-btc-orange/25 hover:text-ink'
                    }`}
                  >
                    {f === 'all' ? t('vault.filterAll') : f === 'verified' ? t('vault.filterVerified') : t('vault.filterDemo')}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-5 text-xs font-chrome">
                <span className="rounded-chip border border-mp/60 bg-card-muted/50 px-2.5 py-1 backdrop-blur-sm">
                  {formatT(t, 'vault.anchored', { count: stamped.length })}
                </span>
                {otsCount > 0 && (
                  <span className="rounded-chip border border-mp-proof/30 bg-mp-proof/10 px-2.5 py-1 text-mp-proof">
                    {otsCount} OTS on disk
                  </span>
                )}
                {verifiedCount > 0 && (
                  <span className="rounded-chip border border-mp-proof/30 bg-mp-proof/10 px-2.5 py-1 text-mp-proof">
                    {formatT(t, 'vault.verified', { count: verifiedCount })}
                  </span>
                )}
                {demoCount > 0 && (
                  <span className="rounded-chip border border-mp-strong/50 bg-section/50 px-2.5 py-1">
                    {formatT(t, 'vault.demoAnchors', { count: demoCount })}
                  </span>
                )}
              </div>
            </>
          )}

          {displayed.map(({ program: p, cinematic }, i) => {
            const proof = p.satohash_proofs![0]
            const hash = proofHash(proof)
            const isDemo = cinematic.proofStatus === 'demo'
            const otsPath = proof.ots_path
            return (
              <GlassCard
                key={p.id}
                variant={isDemo ? 'default' : 'proof'}
                animate
                delay={0.05 + i * 0.03}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 !p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="font-display font-semibold text-ink">{p.flag} {p.name}</div>
                    <ProofBadge status={cinematic.proofStatus} compact txHint={cinematic.proofRef} />
                  </div>
                  <div className="text-xs text-ink-muted mt-1 font-mono break-all opacity-80">
                    Block #{proof.block_height} · {p.last_checked}
                    {otsPath && <span className="text-mp-proof"> · {otsPath}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap shrink-0 items-center">
                  {hash && (
                    <button
                      type="button"
                      onClick={() => applyProgramProof(hash)}
                      className="btn-primary text-xs !py-1.5 !px-3"
                      title={hash}
                    >
                      Use this proof
                    </button>
                  )}
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
                  {otsPath && (
                    <a href={otsPath} download className="btn-secondary text-xs !py-1.5 !px-3">
                      .ots
                    </a>
                  )}
                  <Link to={`/apply?program=${encodeURIComponent(p.name)}`} className="btn-secondary text-xs !py-1.5 !px-3">
                    Apply
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setNostrEvent(
                        serializeNostrEvent(
                          buildProgramUpdateEvent(
                            p.name,
                            isDemo ? 'Demo anchor (seed data)' : 'OTS on disk',
                            proof.proof_url,
                          ),
                        ),
                      )
                    }
                    className="chip text-xs !text-nostr-violet !border-nostr-violet/30 hover:!bg-nostr-violet-soft"
                  >
                    Nostr 30078
                  </button>
                </div>
              </GlassCard>
            )
          })}
          {stamped.length === 0 && (
            <GlassCard className="text-center py-12 text-mp-ink-tertiary font-body">
              {t('vault.empty')}
            </GlassCard>
          )}
        </div>
      )}

      {nostrEvent && (
        <GlassCard variant="elevated" animate className="mt-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-chrome text-sm font-semibold text-ink flex items-center gap-2">
              <Shield size={14} className="text-btc-orange" /> {t('vault.nostrStub')}
            </h3>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(nostrEvent)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="chip text-xs inline-flex items-center gap-1"
              aria-label={t('vault.copyNostr')}
            >
              {copied ? <Check size={12} className="text-status-green" /> : <Copy size={12} />}
              {t('vault.copyNostr')}
            </button>
          </div>
          <pre className="text-[10px] font-mono text-ink-secondary overflow-x-auto whitespace-pre-wrap bg-card-muted/40 rounded-mp-md p-4 border border-mp/50 backdrop-blur-sm">
            {nostrEvent}
          </pre>
          <span className="sr-only" aria-live="polite">{copied ? t('vault.copied') : ''}</span>
        </GlassCard>
      )}
    </div>
  )
}