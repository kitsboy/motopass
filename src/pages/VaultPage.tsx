import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, Copy, Check, FileCheck, Loader2, Hash, BadgeCheck, Search, Radio, Download } from 'lucide-react'
import { downloadVaultCredentials } from '../lib/vaultCredentialExport'
import { usePrograms } from '../hooks/usePrograms'
import { usePortfolio } from '../hooks/usePortfolio'
import { toCinematicProgram } from '../lib/programAdapter'
import { parseHashLines, verifyHashPaste, verifyOtsInBrowser, satohashVerifyUrl } from '../lib/seal/vaultVerify'
import { VaultEducationCard } from '../components/vault/VaultEducationCard'
import { RowSkeleton } from '../components/LoadingSkeleton'
import { ProgramsLoadError } from '../components/ui/ProgramsLoadError'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { HowItWorksSection } from '../components/ui/HowItWorksSection'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import type { VerifyResult } from '../types/proof'
import { PageAnchorNav } from '../components/nav/PageAnchorNav'
import { estimateReadingMinutes } from '../lib/utils'
import { VerifyResultsExplainer } from '../components/verify/VerifyResultsExplainer'
import { VaultOtsDropZone } from '../components/vault/VaultOtsDropZone'
import { VaultProofRow } from '../components/vault/VaultProofRow'

type VaultFilter = 'all' | 'verified' | 'demo'

const VAULT_FILTERS: VaultFilter[] = ['all', 'verified', 'demo']

function proofHash(proof: { content_hash?: string; proof_url?: string }): string {
  if (proof.content_hash) return proof.content_hash
  const tail = proof.proof_url?.replace(/\/$/, '').split('/').pop() ?? ''
  return tail
}

function isTxtHashFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain'
}

export function VaultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightProof = searchParams.get('proof')
  const { t } = useI18n()
  const { programs, loading, error } = usePrograms()
  const { portfolio } = usePortfolio()
  const [nostrEvent, setNostrEvent] = useState('')
  const [filter, setFilter] = useState<VaultFilter>('all')
  const [copied, setCopied] = useState(false)
  const [hashInput, setHashInput] = useState(() => highlightProof ?? '')
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const filterTabRefs = useRef<(HTMLButtonElement | null)[]>([])

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

    if (isTxtHashFile(file)) {
      const text = await file.text()
      const hashes = parseHashLines(text)
      const hash = hashes[0] ?? ''
      if (hash) setHashInput(hash)
      setVerifyBusy(true)
      try {
        setVerifyResult(
          hash
            ? await verifyHashPaste(hash)
            : {
                verified: false,
                hash: '',
                mode: 'failed',
                blockTime: null,
                message: 'No valid SHA-256 hash found in .txt file',
              },
        )
      } finally {
        setVerifyBusy(false)
      }
      return
    }

    const hash = hashInput.trim() || proofHash(stamped[0]?.program.satohash_proofs?.[0] ?? {})
    setVerifyBusy(true)
    try {
      setVerifyResult(await verifyOtsInBrowser(file, hash))
    } finally {
      setVerifyBusy(false)
    }
  }

  useEffect(() => {
    if (!highlightProof) return
    const row = document.querySelector(`[data-vault-proof-hash="${highlightProof}"]`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    row?.classList.add('vault-proof-row--highlight')
    const timer = window.setTimeout(() => row?.classList.remove('vault-proof-row--highlight'), 3200)
    return () => window.clearTimeout(timer)
  }, [highlightProof, displayed.length])

  function applyProgramProof(programName: string, hash: string) {
    const params = new URLSearchParams({
      program: programName,
      proof: hash,
    })
    navigate(`/apply?${params.toString()}`)
  }

  function filterLabel(f: VaultFilter): string {
    return f === 'all' ? t('vault.filterAll') : f === 'verified' ? t('vault.filterVerified') : t('vault.filterDemo')
  }

  function filterCount(f: VaultFilter): number {
    return f === 'all' ? stamped.length : f === 'verified' ? verifiedCount : demoCount
  }

  function onFilterKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const next = (index + dir + VAULT_FILTERS.length) % VAULT_FILTERS.length
    setFilter(VAULT_FILTERS[next])
    filterTabRefs.current[next]?.focus()
  }

  const vaultAnchors = useMemo(
    () => [
      { id: 'vault-guide', label: t('subnav.vault.guide') },
      { id: 'vault-verify', label: t('subnav.vault.verify') },
      { id: 'vault-archive', label: t('subnav.vault.archive') },
    ],
    [t],
  )

  const guideReadingMinutes = useMemo(
    () =>
      estimateReadingMinutes(
        t('vault.how.intro'),
        t('vault.how.step1.body'),
        t('vault.how.step2.body'),
        t('vault.how.step3.body'),
        t('vault.how.step4.body'),
        t('vault.how.footer'),
      ),
    [t],
  )

  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <PageHeader
        eyebrow={`MEMBERS · ${t('vault.eyebrow')}`}
        title={t('vault.title')}
        subtitle={t('vault.subtitle')}
        actions={
          stamped.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => downloadVaultCredentials(programs)}
              className="shrink-0"
            >
              <Download size={14} /> Export credentials
            </Button>
          ) : undefined
        }
      />

      <PageAnchorNav items={vaultAnchors} />

      <div id="vault-guide" className="scroll-mt-header">
      <HowItWorksSection
        eyebrow={t('vault.how.eyebrow')}
        title={t('vault.how.title')}
        intro={t('vault.how.intro')}
        footerNote={t('vault.how.footer')}
        readingMinutes={guideReadingMinutes}
        steps={[
          { n: '01', title: t('vault.how.step1.title'), body: t('vault.how.step1.body'), icon: Hash },
          { n: '02', title: t('vault.how.step2.title'), body: t('vault.how.step2.body'), icon: BadgeCheck },
          {
            n: '03',
            title: t('vault.how.step3.title'),
            body: t('vault.how.step3.body'),
            icon: Search,
            link: { to: '/verify', label: 'Stamp your own hash' },
          },
          {
            n: '04',
            title: t('vault.how.step4.title'),
            body: t('vault.how.step4.body'),
            icon: Radio,
            link: { to: '/apply', label: 'Open applications' },
          },
        ]}
      />
      </div>

      <VaultEducationCard />

      <Card id="vault-verify" variant="proof" animate className="mb-8 scroll-mt-header" aria-labelledby="vault-verify-heading">
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
          <Button
            type="button"
            size="sm"
            onClick={handleHashVerify}
            disabled={verifyBusy || !hashInput.trim()}
            className="shrink-0 min-w-[7rem]"
          >
            {verifyBusy ? <Loader2 size={14} className="animate-spin" /> : 'Verify hash'}
          </Button>
        </div>

        <input ref={fileRef} type="file" accept=".ots,.txt,application/octet-stream,text/plain" className="hidden" />

        <VaultOtsDropZone busy={verifyBusy} selectedFile={selectedFile} onFile={f => void handleOtsUpload(f)} />

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
            <VerifyResultsExplainer
              messageKey={verifyResult.verified ? 'vault.verify.resultsExplainerOk' : 'vault.verify.resultsExplainerFail'}
            />
          </div>
        )}
      </Card>

      {error && <ProgramsLoadError message={error} />}
      {loading && !error && <RowSkeleton count={5} />}
      {!loading && !error && (
        <div id="vault-archive" className="space-y-3 scroll-mt-header">
          {stamped.length > 0 && (
            <>
              <div
                role="tablist"
                aria-label={t('vault.filterTabs')}
                className="flex flex-wrap gap-2 mb-4"
              >
                {VAULT_FILTERS.map((f, i) => (
                  <button
                    key={f}
                    ref={el => {
                      filterTabRefs.current[i] = el
                    }}
                    type="button"
                    role="tab"
                    id={`vault-filter-${f}`}
                    aria-selected={filter === f}
                    tabIndex={filter === f ? 0 : -1}
                    onClick={() => setFilter(f)}
                    onKeyDown={e => onFilterKeyDown(e, i)}
                    className={`rounded-chip border px-2.5 py-1 text-xs font-chrome transition-all duration-fast ${
                      filter === f
                        ? 'border-btc-orange/35 bg-btc-orange-soft/60 text-mp-btc-text shadow-mp-1'
                        : 'border-mp/70 text-ink-muted hover:border-btc-orange/25 hover:text-ink'
                    }`}
                  >
                    {filterLabel(f)}
                    <span
                      className={`ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1 py-0.5 text-[9px] font-mono ${
                        filter === f
                          ? 'bg-btc-orange/20 text-mp-btc-text'
                          : 'bg-card-muted/80 text-ink-muted'
                      }`}
                      aria-label={formatT(t, 'vault.filterCount', { count: filterCount(f) })}
                    >
                      {filterCount(f)}
                    </span>
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

          {displayed.map(({ program: p, cinematic }, i) => (
            <VaultProofRow
              key={p.id}
              program={p}
              cinematic={cinematic}
              index={i}
              inPortfolio={portfolio.includes(p.id)}
              onUseProof={applyProgramProof}
              onNostrStub={setNostrEvent}
            />
          ))}
          {stamped.length === 0 && (
            <Card className="text-center py-12 text-mp-ink-tertiary font-body">
              {t('vault.empty')}
            </Card>
          )}
        </div>
      )}

      {nostrEvent && (
        <Card variant="elevated" animate className="mt-8">
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
        </Card>
      )}
    </div>
  )
}