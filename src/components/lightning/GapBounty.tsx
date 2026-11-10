import { useState } from 'react'
import { Check, Copy, ExternalLink, Zap } from 'lucide-react'
import { bountyMemo, gapBounty } from '../../lib/bounties'
import { lightningDeepLink, requestInvoice, resolveLnurlPay } from '../../lib/lnurl'
import { NWC_STORAGE_KEY } from '../../lib/nwc'
import { PaymentQrCode } from '../ui/PaymentQrCode'
import { TipReceipt } from './TipReceipt'

/**
 * Fund a missing fact.
 *
 * Two rails, both live: an LNURL-pay invoice from the project Lightning Address,
 * or an invoice from the visitor's own connected wallet (which can then issue a
 * signed settlement receipt). The copy is deliberate: this is a tip toward
 * research time. It does not buy a finding, a date, or a favourable answer, and
 * it does not pre-fill the fact.
 */

type State =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'invoice'; invoice: string; sats: number }
  | { phase: 'error'; error: string }

function storedNwcUri(): string {
  try {
    return sessionStorage.getItem(NWC_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function GapBounty({ factKey, programName }: { factKey: string; programName: string }) {
  const bounty = gapBounty(factKey)
  const [state, setState] = useState<State>({ phase: 'idle' })
  const [copied, setCopied] = useState(false)
  const nwcUri = storedNwcUri()

  if (!bounty) {
    return (
      <p className="mt-2 text-[11px] text-mp-ink-tertiary">
        No Lightning Address is configured, so there is nothing to pay. The gap stays open.
      </p>
    )
  }

  const request = async () => {
    setState({ phase: 'loading' })
    const resolved = await resolveLnurlPay(bounty.address)
    if (!resolved.ok) {
      setState({ phase: 'error', error: resolved.error })
      return
    }
    const invoice = await requestInvoice(
      resolved.params,
      bounty.sats,
      fetch,
      bountyMemo(factKey, programName),
    )
    if (!invoice.ok) {
      setState({ phase: 'error', error: invoice.error })
      return
    }
    setState({ phase: 'invoice', invoice: invoice.invoice, sats: invoice.sats })
  }

  const copyInvoice = async () => {
    if (state.phase !== 'invoice') return
    try {
      await navigator.clipboard.writeText(state.invoice)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-2 rounded-mp-md border border-mp-border bg-section/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] text-mp-ink-secondary">
          Suggested tip: <span className="font-mono text-mp-btc-text">{bounty.sats.toLocaleString()} sats</span> to{' '}
          <span className="font-mono">{bounty.address}</span>
        </p>
        {state.phase !== 'invoice' && (
          <button
            type="button"
            onClick={() => void request()}
            disabled={state.phase === 'loading'}
            className="inline-flex items-center gap-1 rounded-full border border-mp-btc/40 px-2.5 py-1 font-chrome text-[11px] font-semibold text-mp-btc-text transition-colors hover:bg-mp-btc/10 disabled:opacity-50"
          >
            <Zap size={11} aria-hidden="true" />
            {state.phase === 'loading' ? 'Resolving…' : 'Get invoice'}
          </button>
        )}
      </div>

      {state.phase === 'error' && (
        <div className="mt-2 space-y-1.5">
          <p className="text-[11px] text-mp-wax">{state.error}</p>
          <a
            href={bounty.walletUri}
            className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
          >
            Open {bounty.sats.toLocaleString()} sats in a wallet instead <ExternalLink size={10} aria-hidden="true" />
          </a>
        </div>
      )}

      {state.phase === 'invoice' && (
        <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <PaymentQrCode value={state.invoice} label={`${state.sats.toLocaleString()} sats`} />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="break-all font-mono text-[10px] leading-relaxed text-mp-ink-tertiary">
              {state.invoice}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyInvoice()}
                className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[11px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
              >
                {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy invoice'}
              </button>
              <a
                href={`lightning:${state.invoice}`}
                className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[11px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
              >
                Open in wallet <ExternalLink size={11} aria-hidden="true" />
              </a>
            </div>
            <p className="text-[10px] leading-relaxed text-mp-ink-tertiary">
              A tip funds research time. It does not buy a finding or a date, and the fact stays empty until an
              official source is read.
            </p>
          </div>
        </div>
      )}

      {state.phase === 'idle' && lightningDeepLink(bounty.address, bounty.sats) && (
        <p className="mt-1.5 text-[10px] leading-relaxed text-mp-ink-tertiary">
          Paying does not pre-fill the fact or change what the source says.
        </p>
      )}

      {nwcUri ? (
        <TipReceipt nwcUri={nwcUri} factKey={factKey} programName={programName} sats={bounty.sats} />
      ) : (
        <p className="mt-2 border-t border-mp-border-subtle pt-2 text-[9px] leading-relaxed text-mp-ink-tertiary">
          Want a signed settlement receipt? Connect a wallet in Portfolio → Lightning wallet. MotoPass cannot see
          an LNURL payment settle on its own.
        </p>
      )}
    </div>
  )
}
