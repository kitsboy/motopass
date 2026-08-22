import { useCallback, useEffect, useRef, useState } from 'react'
import { Bolt, CheckCircle2, Copy, ExternalLink, Loader2, RefreshCw, ShieldCheck, TriangleAlert, Wallet } from 'lucide-react'
import { PaymentQrCode } from '../ui/PaymentQrCode'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import { formatSats } from '../../lib/btcPrice'
import {
  createApplicationFeeInvoice,
  fetchApplicationFeeConfig,
  fetchApplicationFeeStatus,
  type ApplicationFeeConfig,
} from '../../lib/applicationFee'

/**
 * ApplicationFeeStep — the real Lightning application-fee step (Seam B).
 *
 * Zero-knowledge by design: we send only the applicant's canonical application
 * hash (not identity). The invoice is keyed ONLY by payment_hash; no name,
 * no email, no account is ever sent to the server. The receipt memo carries
 * the app hash so the fee ties to the application without storing identity.
 *
 * Honest constraint: LND currently has 0 channels, so a real inbound Lightning
 * settlement is blocked until channels open. The step wires the REAL rail
 * (live BOLT11 on the MotoPass wallet) and polls settlement honestly — the UI
 * never pretends a payment landed when it hasn't.
 */
type Props = {
  appHash: string
  appId: string
  program: string
}

const POLL_MS = 4000
const POLL_MAX = 45 // ~3 min before giving up on live poll

export function ApplicationFeeStep({ appHash, appId, program }: Props) {
  const { toast } = useToast()
  const [config, setConfig] = useState<ApplicationFeeConfig | null>(null)
  const [invoice, setInvoice] = useState<{
    payment_request: string
    payment_hash: string
    amount_sats: number
    memo?: string
    note?: string
  } | null>(null)
  const [creating, setCreating] = useState(false)
  const [pollState, setPollState] = useState<'idle' | 'pending' | 'paid' | 'error' | 'timeout'>('idle')
  const [pollError, setPollError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const pollCountRef = useRef(0)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadConfig = useCallback(async () => {
    const cfg = await fetchApplicationFeeConfig()
    setConfig(cfg)
  }, [])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  const handleCreate = async () => {
    if (!appHash) return
    setCreating(true)
    setPollError(null)
    setPollState('idle')
    try {
      const result = await createApplicationFeeInvoice(appHash)
      if (!result.ok || !result.payment_request || !result.payment_hash) {
        setPollState('error')
        setPollError(result.error ?? 'Invoice creation failed — the fee rail may be temporarily down.')
        return
      }
      setInvoice({
        payment_request: result.payment_request,
        payment_hash: result.payment_hash,
        amount_sats: result.amount_sats ?? config?.sats ?? 0,
        memo: result.memo,
        note: result.note,
      })
      setPollState('pending')
      pollCountRef.current = 0
      pollTimerRef.current = setInterval(async () => {
        pollCountRef.current += 1
        const st = await fetchApplicationFeeStatus(result.payment_hash!)
        if (st.ok && st.paid) {
          setPollState('paid')
          stopPolling()
          return
        }
        if (st.ok && st.status === 'error') {
          setPollState('error')
          setPollError(st.error ?? 'Settlement check failed.')
          stopPolling()
          return
        }
        if (pollCountRef.current >= POLL_MAX) {
          setPollState('timeout')
          stopPolling()
        }
      }, POLL_MS)
    } finally {
      setCreating(false)
    }
  }

  const copyBolt11 = async () => {
    if (!invoice) return
    await navigator.clipboard.writeText(invoice.payment_request)
    setCopied(true)
    toast('BOLT11 invoice copied', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const feeSats = config?.sats ?? invoice?.amount_sats ?? 0
  const railNote = config?.note

  return (
    <Card variant="elevated" className="mb-6 overflow-hidden border-mp-btc/20">
      <div className="flex items-start gap-3 border-b border-mp/40 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-mp-md bg-btc-orange/15 border border-btc-orange/25">
          <Bolt size={18} className="text-btc-orange" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-chrome text-sm font-semibold text-ink">
            Application fee · pay with Lightning
          </p>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Your application hash is sealed. Pay the fee on the MotoPass wallet to complete the
            application — no account, no email, no identity.
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* fee + status row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-chrome text-[10px] uppercase tracking-wider text-mp-ink-tertiary">
              Application fee
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-semibold text-mp-btc-text">
                {feeSats > 0 ? formatSats(feeSats) : '—'}
              </span>
              {config && !config.ok && (
                <span className="text-[10px] font-mono text-status-amber">fee rail unreachable</span>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-chip border border-mp-proof/35 bg-mp-proof/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-mp-proof">
            <ShieldCheck className="h-3 w-3" aria-hidden /> zero-knowledge
          </span>
        </div>

        {/* app hash reference */}
        <div className="rounded-mp-md border border-mp/60 bg-card-muted/40 px-3 py-2">
          <span className="font-chrome text-[10px] uppercase tracking-wider text-mp-ink-tertiary">
            Application · {program || appId}
          </span>
          <p className="mt-0.5 break-all font-mono text-[10px] text-mp-ink-secondary">{appHash}</p>
        </div>

        {/* invoice + payment */}
        {!invoice && pollState !== 'error' && (
          <Button
            type="button"
            className="w-full"
            disabled={creating || !config?.ok}
            loading={creating}
            onClick={handleCreate}
          >
            <Wallet className="h-4 w-4 mr-2" aria-hidden />
            {creating ? 'Creating invoice…' : 'Pay application fee with Lightning'}
          </Button>
        )}

        {pollState === 'error' && (
          <div className="rounded-mp-md border border-status-red/35 bg-status-red/10 px-3 py-2.5 text-xs text-status-red">
            <p className="font-chrome font-semibold">Invoice unavailable</p>
            <p className="mt-1 text-status-red/90">{pollError}</p>
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-chrome hover:underline"
              onClick={() => {
                setPollState('idle')
                setInvoice(null)
              }}
            >
              <RefreshCw size={12} aria-hidden /> Try again
            </button>
          </div>
        )}

        {invoice && pollState !== 'error' && (
          <div className="space-y-3">
            <div className="flex flex-col items-center">
              <PaymentQrCode
                value={`lightning:${invoice.payment_request.toUpperCase()}`}
                label="MotoPass application fee"
              />
              <div className="mt-3 flex w-full max-w-sm flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyBolt11}
                  className="chip text-[11px] !py-1.5 inline-flex items-center gap-1.5 hover:text-mp-btc-text"
                >
                  {copied ? <CheckCircle2 size={12} className="text-status-green" /> : <Copy size={12} />}
                  {copied ? 'BOLT11 copied' : 'Copy BOLT11 invoice'}
                </button>
                <a
                  href={`lightning:${invoice.payment_request.toUpperCase()}`}
                  className="chip text-[11px] !py-1.5 inline-flex items-center gap-1.5 hover:text-mp-btc-text"
                >
                  <ExternalLink size={12} aria-hidden /> Open in wallet
                </a>
              </div>
            </div>

            {/* settlement status */}
            <div
              className={`rounded-mp-md border px-3 py-2.5 text-xs ${
                pollState === 'paid'
                  ? 'border-mp-proof/35 bg-mp-proof/10 text-mp-proof'
                  : 'border-mp/60 bg-card-muted/40 text-ink-muted'
              }`}
            >
              {pollState === 'pending' && (
                <p className="flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" aria-hidden />
                  Waiting for payment… settle in any Lightning wallet. Status auto-refreshes.
                </p>
              )}
              {pollState === 'paid' && (
                <p className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 size={14} aria-hidden />
                  Payment received — application fee settled. This invoice is your zero-knowledge
                  receipt ({invoice.payment_hash.slice(0, 10)}…).
                </p>
              )}
              {pollState === 'timeout' && (
                <p className="text-status-amber">
                  Still waiting on settlement — the invoice stays valid for ~1h. Re-check with the
                  Satohash proof page later; your payment will not be lost.
                </p>
              )}
            </div>

            {railNote && (
              <p className="text-[10px] leading-relaxed text-mp-ink-tertiary">{railNote}</p>
            )}
          </div>
        )}

        {config?.ok && config?.note && (
          <p className="text-[10px] leading-relaxed text-mp-ink-tertiary">
            {config.note}
          </p>
        )}

        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-mp-ink-tertiary">
          <TriangleAlert size={11} className="mt-0.5 shrink-0 text-status-amber" aria-hidden />
          Honest constraint: the MotoPass Lightning node currently has zero open channels, so a real
          inbound payment may not settle until channels are opened. The fee step is wired to the live
          rail — the moment channels open, the same invoice route works.
        </p>
      </div>
    </Card>
  )
}
