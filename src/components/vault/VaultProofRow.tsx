import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Radio,
  GitBranch,
  Hash,
} from 'lucide-react'
import { nostrEventIdStub } from '../../lib/nostrEventId'
import { Card } from '../ui/Card'
import { ProofBadge } from '../ui/ProofBadge'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'
import { satohashVerifyUrl } from '../../lib/seal/vaultVerify'
import { buildProgramProofEvent, serializeNostrEvent } from '../../lib/nostrEvents'
import type { Program } from '../../types/program'
import type { Program as CinematicProgram } from '../programs/types'

function proofHash(proof: { content_hash?: string; proof_url?: string }): string {
  if (proof.content_hash) return proof.content_hash
  const tail = proof.proof_url?.replace(/\/$/, '').split('/').pop() ?? ''
  return tail
}

export function VaultProofRow({
  program,
  cinematic,
  index,
  inPortfolio,
  selected,
  onToggleSelect,
  onUseProof,
  onNostrStub,
}: {
  program: Program
  cinematic: CinematicProgram
  index: number
  inPortfolio: boolean
  selected?: boolean
  onToggleSelect?: (programId: number) => void
  onUseProof: (programName: string, hash: string) => void
  onNostrStub: (json: string) => void
}) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null)

  const proofs = program.satohash_proofs ?? []
  const primary = proofs[0]
  const hash = primary ? proofHash(primary) : ''
  const isDemo = cinematic.proofStatus === 'demo'
  const verifyUrl = hash ? satohashVerifyUrl(hash) : ''

  async function copyVerifyUrl() {
    if (!verifyUrl) return
    await navigator.clipboard.writeText(verifyUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  function publishNostrStub() {
    if (!primary) return
    onNostrStub(
      serializeNostrEvent(
        buildProgramProofEvent(
          program.name,
          isDemo ? 'Demo anchor (seed data)' : 'OTS on disk',
          {
            field: primary.field,
            content_hash: primary.content_hash ?? hash,
            block_height: primary.block_height,
            proof_url: primary.proof_url,
            ots_path: primary.ots_path,
            proof_status: isDemo ? 'demo' : 'verified',
          },
        ),
      ),
    )
  }

  const detailsId = `vault-proof-${program.id}-details`
  const hasLineage = proofs.length > 1

  const toggleLineage = useCallback(() => {
    if (!hasLineage) return
    setExpanded(v => !v)
  }, [hasLineage])

  return (
    <Card
      variant={isDemo ? 'default' : 'proof'}
      animate
      delay={0.05 + index * 0.03}
      className={`!p-0 overflow-hidden ${isDemo ? 'vault-demo-watermark' : ''}`}
      data-vault-proof-hash={hash || undefined}
    >
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 relative z-[1] ${
          hasLineage ? 'vault-proof-row-header--tappable md:cursor-default' : ''
        }`}
        onClick={e => {
          if (!hasLineage) return
          if (window.matchMedia('(min-width: 768px)').matches) return
          const target = e.target as HTMLElement
          if (target.closest('button, a, input, select, textarea')) return
          toggleLineage()
        }}
        onKeyDown={e => {
          if (!hasLineage || (e.key !== 'Enter' && e.key !== ' ')) return
          if (window.matchMedia('(min-width: 768px)').matches) return
          e.preventDefault()
          toggleLineage()
        }}
        role={hasLineage ? 'button' : undefined}
        tabIndex={hasLineage ? 0 : undefined}
        aria-expanded={hasLineage ? expanded : undefined}
        aria-controls={hasLineage ? detailsId : undefined}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={selected ?? false}
                onChange={() => onToggleSelect(program.id)}
                onClick={e => e.stopPropagation()}
                className="rounded border-mp shrink-0"
                aria-label={formatT(t, 'vault.selectProof', { name: program.name })}
              />
            )}
            <div className="font-display font-semibold text-ink">
              {program.flag} {program.name}
            </div>
            <ProofBadge status={cinematic.proofStatus} compact txHint={cinematic.proofRef} />
            {isDemo && (
              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-chip border border-mp-strong/50 text-ink-muted">
                {t('vault.demoWatermark')}
              </span>
            )}
          </div>
          <div className="text-xs text-ink-muted mt-1 font-mono break-all opacity-80">
            Block #{primary?.block_height} · {program.last_checked}
            {primary?.ots_path && <span className="text-mp-proof"> · {primary.ots_path}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0 items-center">
          {hash && (
            <button
              type="button"
              onClick={() => onUseProof(program.name, hash)}
              className="btn-primary text-xs !py-1.5 !px-3"
              title={hash}
            >
              {t('vault.useProof')}
            </button>
          )}
          {verifyUrl && (
            <button
              type="button"
              onClick={() => void copyVerifyUrl()}
              className="btn-secondary text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
              aria-label={t('vault.copyVerifyUrl')}
            >
              {copiedUrl ? <Check size={12} className="text-status-green" /> : <Copy size={12} />}
              {t('vault.copyVerifyUrl')}
            </button>
          )}
          {primary?.proof_url && (
            <a
              href={primary.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
              aria-label={t('vault.satohashExternal')}
              title={t('vault.satohashExternal')}
            >
              <ExternalLink size={14} className="text-btc-orange shrink-0" aria-hidden />
              <span className="sr-only sm:not-sr-only">Satohash</span>
            </a>
          )}
          {primary?.ots_path && (
            <a href={primary.ots_path} download className="btn-secondary text-xs !py-1.5 !px-3">
              .ots
            </a>
          )}
          {inPortfolio && (
            <Link to="/portfolio" className="btn-secondary text-xs !py-1.5 !px-3">
              {t('vault.inPortfolio')}
            </Link>
          )}
          <Link
            to={`/apply?program=${encodeURIComponent(program.name)}${hash ? `&proof=${encodeURIComponent(hash)}` : ''}`}
            className="btn-secondary text-xs !py-1.5 !px-3"
          >
            Apply
          </Link>
          <button
            type="button"
            onClick={publishNostrStub}
            className="chip text-xs !text-nostr-violet !border-nostr-violet/30 hover:!bg-nostr-violet-soft inline-flex items-center gap-1"
          >
            <Radio size={12} aria-hidden />
            {t('vault.nostrPublish')}
          </button>
          {proofs.length > 1 && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={detailsId}
              onClick={() => setExpanded(v => !v)}
              className="chip text-xs inline-flex items-center gap-1"
            >
              <GitBranch size={12} aria-hidden />
              {expanded ? t('vault.collapseLineage') : t('vault.expandLineage')}
              <ChevronDown
                size={12}
                className={`transition-transform duration-fast ${expanded ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && proofs.length > 1 && (
          <motion.div
            id={detailsId}
            key="lineage"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-mp/50 bg-card-muted/25"
          >
            <div className="px-5 py-4">
              <h3 className="font-chrome text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-3">
                {t('vault.lineageTitle')}
              </h3>
              <ol className="relative border-l border-mp-proof/30 ml-2 space-y-4">
                {proofs.map((proof, i) => {
                  const stepHash = proofHash(proof)
                  const stepUrl = stepHash ? satohashVerifyUrl(stepHash) : proof.proof_url
                  const eventStub = buildProgramProofEvent(
                    program.name,
                    isDemo ? 'Demo anchor (seed data)' : 'OTS on disk',
                    {
                      field: proof.field,
                      content_hash: proof.content_hash ?? stepHash,
                      block_height: proof.block_height,
                      proof_url: proof.proof_url,
                      ots_path: proof.ots_path,
                      proof_status: isDemo ? 'demo' : 'verified',
                    },
                  )
                  const eventId = nostrEventIdStub(eventStub)
                  const copyKey = `${proof.field}-${i}`
                  return (
                    <li key={`${proof.field}-${i}`} className="relative pl-5">
                      <span
                        className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-mp-proof bg-card"
                        aria-hidden
                      />
                      <div className="text-xs font-chrome font-semibold text-ink">{proof.field}</div>
                      <div className="text-[10px] font-mono text-ink-muted mt-0.5 break-all">
                        {proof.block_height != null && <>Block #{proof.block_height} · </>}
                        {stepHash ? `${stepHash.slice(0, 16)}…` : '—'}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {stepUrl && (
                          <a
                            href={stepUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-btc-orange hover:underline inline-flex items-center gap-1"
                          >
                            Satohash <ExternalLink size={10} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(eventId)
                            setCopiedEventId(copyKey)
                            window.setTimeout(() => setCopiedEventId(null), 2000)
                          }}
                          className="text-[10px] text-ink-muted hover:text-mp-btc-text inline-flex items-center gap-1"
                          aria-label={t('vault.copyEventId')}
                        >
                          {copiedEventId === copyKey ? (
                            <Check size={10} className="text-status-green" />
                          ) : (
                            <Hash size={10} />
                          )}
                          {t('vault.copyEventId')}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}