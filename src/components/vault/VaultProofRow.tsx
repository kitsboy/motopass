import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  Anchor,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileCheck2,
  FileDown,
  GitBranch,
  Hash,
  Radio,
} from 'lucide-react'
import { InfoTip } from '../ui/InfoTip'
import { nostrEventIdStub } from '../../lib/nostrEventId'
import { Card } from '../ui/Card'
import { ProofBadge } from '../ui/ProofBadge'
import { useI18n } from '../../i18n/I18nContext'
import { useToast } from '../ui/Toast'
import { formatT } from '../../i18n/format'
import { satohashVerifyUrl, safeSatohashHref } from '../../lib/satohash'
import { normalizeSha256, sanitizeOtsPath } from '../../lib/timestampSecurity'
import { buildProgramProofEvent } from '../../lib/nostrEvents'
import { announceTimestampOnNostr } from '../../lib/nostrTimestamp'
import type { Program } from '../../types/program'
import type { Program as CinematicProgram } from '../programs/types'

function proofHash(proof: { content_hash?: string; proof_url?: string }): string {
  if (proof.content_hash && normalizeSha256(proof.content_hash)) return normalizeSha256(proof.content_hash)!
  const tail = proof.proof_url?.replace(/\/$/, '').split('/').pop() ?? ''
  return normalizeSha256(tail) ?? ''
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
  const { toast } = useToast()
  const reduceMotion = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null)
  const [announceBusy, setAnnounceBusy] = useState(false)

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

  async function announceNostr() {
    if (!primary || announceBusy) return
    setAnnounceBusy(true)
    try {
      const result = await announceTimestampOnNostr(
        buildProgramProofEvent(
          program.name,
          isDemo ? 'Demo anchor (seed data)' : 'OTS on disk',
          {
            field: primary.field,
            content_hash: primary.content_hash ?? hash,
            block_height: primary.block_height,
            proof_url: primary.proof_url,
            ots_path: primary.ots_path,
            proof_status: isDemo ? 'demo' : 'unverified',
          },
        ),
      )
      onNostrStub(result.json)
      if (result.published) toast(t('verify.nostrAnnounceOk'), 'success')
      else if (result.error) toast(t('verify.nostrAnnounceFail'), 'error')
      else toast(t('verify.nostrAnnounceStub'), 'default')
    } finally {
      setAnnounceBusy(false)
    }
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
      className={`!p-0 ${isDemo ? 'vault-demo-watermark' : ''}`}
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
          <div className="flex flex-wrap items-center gap-2">
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
            <InfoTip
              tip={
                cinematic.proofStatus === 'verified'
                  ? t('vault.tip.badgeVerified')
                  : cinematic.proofStatus === 'recorded'
                    ? t('vault.tip.badgeRecorded')
                    : cinematic.proofStatus === 'pending'
                      ? t('vault.tip.badgePending')
                      : t('vault.tip.badgeDemo')
              }
            >
              <ProofBadge status={cinematic.proofStatus} compact txHint={cinematic.proofRef} />
            </InfoTip>
            {isDemo && (
              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-chip border border-mp-strong/50 text-ink-muted">
                {t('vault.demoWatermark')}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-mp-md border border-mp/50 bg-card-muted/40 px-3 py-2 font-mono text-[11px] text-ink-muted">
            {primary?.block_height != null && (
              <InfoTip tip={t('vault.tip.block')}>
                <span className="inline-flex items-center gap-1.5">
                  <Anchor size={11} className="text-mp-proof shrink-0" aria-hidden />
                  <span className="sr-only">{t('vault.blockLabel')}</span>
                  <span className="text-ink-secondary font-semibold">#{primary.block_height}</span>
                </span>
              </InfoTip>
            )}
            {program.last_checked && (
              <InfoTip tip={t('vault.tip.checked')}>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={11} className="shrink-0" aria-hidden />
                  <span className="sr-only">{t('modal.lastChecked')}</span>
                  <span>{program.last_checked}</span>
                </span>
              </InfoTip>
            )}
            {hash && (
              <InfoTip
                tip={
                  <span>
                    {t('vault.tip.hash')}
                    <br />
                    <code className="mt-1 block break-all font-mono text-[9px] text-ink-muted">{hash}</code>
                  </span>
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  <Hash size={11} className="shrink-0" aria-hidden />
                  <span className="sr-only">{t('vault.hashLabel')}</span>
                  <span className="text-ink-secondary">{hash.slice(0, 10)}…</span>
                </span>
              </InfoTip>
            )}
            {primary?.ots_path && (
              <InfoTip tip={t('vault.tip.ots')}>
                <span className="inline-flex items-center gap-1.5">
                  <FileCheck2 size={11} className="text-mp-proof shrink-0" aria-hidden />
                  <span className="sr-only">{t('vault.otsLabel')}</span>
                  <span className="break-all">{primary.ots_path}</span>
                </span>
              </InfoTip>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0 items-center">
          {hash && (
            <InfoTip tip={t('vault.tip.useProof')}>
              <button
                type="button"
                onClick={() => onUseProof(program.name, hash)}
                className="btn-primary text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
              >
                <BadgeCheck size={13} aria-hidden />
                {t('vault.useProof')}
              </button>
            </InfoTip>
          )}
          {verifyUrl && (
            <InfoTip tip={t('vault.tip.copyUrl')}>
              <button
                type="button"
                onClick={() => void copyVerifyUrl()}
                className="btn-secondary text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
                aria-label={t('vault.copyVerifyUrl')}
              >
                {copiedUrl ? <Check size={12} className="text-status-green" /> : <Copy size={12} />}
                {t('vault.copyVerifyUrl')}
              </button>
            </InfoTip>
          )}
          {safeSatohashHref(primary?.proof_url) && (
            <InfoTip tip={t('vault.tip.satohash')}>
              <a
                href={safeSatohashHref(primary?.proof_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
                aria-label={t('vault.satohashExternal')}
              >
                <ExternalLink size={14} className="text-btc-orange shrink-0" aria-hidden />
                <span className="sr-only sm:not-sr-only">Satohash</span>
              </a>
            </InfoTip>
          )}
          {sanitizeOtsPath(primary?.ots_path ?? '') && (
            <InfoTip tip={t('vault.tip.otsDownload')}>
              <a
                href={sanitizeOtsPath(primary?.ots_path ?? '') ?? undefined}
                download
                className="btn-secondary text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
                aria-label={t('vault.otsLabel')}
              >
                <FileDown size={13} aria-hidden />
                .ots
              </a>
            </InfoTip>
          )}
          {inPortfolio && (
            <Link to="/portfolio" className="btn-secondary text-xs !py-1.5 !px-3">
              {t('vault.inPortfolio')}
            </Link>
          )}
          <InfoTip tip={t('vault.tip.apply')}>
            <Link
              to={`/apply?program=${encodeURIComponent(program.name)}${hash ? `&proof=${encodeURIComponent(hash)}` : ''}`}
              className="btn-secondary text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
            >
              Apply
              <ArrowRight size={13} aria-hidden />
            </Link>
          </InfoTip>
          <InfoTip tip={t('vault.tip.nostr')}>
            <button
              type="button"
              onClick={() => void announceNostr()}
              disabled={announceBusy}
              className="chip text-xs !text-nostr-violet !border-nostr-violet/30 hover:!bg-nostr-violet-soft inline-flex items-center gap-1 disabled:opacity-60"
            >
              <Radio size={12} aria-hidden />
              {announceBusy ? t('verify.nostrAnnouncing') : t('vault.nostrPublish')}
            </button>
          </InfoTip>
          {proofs.length > 1 && (
            <InfoTip tip={t('vault.tip.lineage')}>
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
            </InfoTip>
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
                  const stepUrl = stepHash ? satohashVerifyUrl(stepHash) : safeSatohashHref(proof.proof_url)
                  const eventStub = buildProgramProofEvent(
                    program.name,
                    isDemo ? 'Demo anchor (seed data)' : 'OTS on disk',
                    {
                      field: proof.field,
                      content_hash: proof.content_hash ?? stepHash,
                      block_height: proof.block_height,
                      proof_url: proof.proof_url,
                      ots_path: proof.ots_path,
                      proof_status: isDemo ? 'demo' : 'unverified',
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
                          <InfoTip tip={t('vault.tip.satohash')}>
                            <a
                              href={stepUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-btc-orange hover:underline inline-flex items-center gap-1"
                            >
                              Satohash <ExternalLink size={10} />
                            </a>
                          </InfoTip>
                        )}
                        <InfoTip tip={t('vault.tip.lineageEventId')}>
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
                        </InfoTip>
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