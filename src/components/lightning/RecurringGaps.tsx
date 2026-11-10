import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { Program } from '../programs/types'
import { gapPlan, standingMemo } from '../../lib/bounties'
import { offerDeepLink, parseBolt12Offer, shortOffer } from '../../lib/bolt12'
import { formatSatsExact } from '../../lib/satsAnchor'
import { PaymentQrCode } from '../ui/PaymentQrCode'

/**
 * A standing commitment to a country's open gaps.
 *
 * The arithmetic is ours (open gaps × the suggested tip, once a month). The
 * offer is not: only the wallet that will be paid can issue a BOLT12 offer, and
 * a browser tab cannot charge on a schedule. So this panel shows the plan, and
 * shows an offer only when one is actually configured and its checksum passes.
 */
const CONFIGURED_OFFER = (import.meta.env.VITE_BOLT12_OFFER ?? '').trim()

export function RecurringGaps({ program, missing }: { program: Program; missing: number }) {
  const plan = gapPlan(missing)
  const [copied, setCopied] = useState(false)
  if (!plan) return null

  const offer = CONFIGURED_OFFER ? parseBolt12Offer(CONFIGURED_OFFER) : null
  const deepLink = offer?.ok ? offerDeepLink(offer.offer.offer) : null

  const copyMemo = async () => {
    try {
      await navigator.clipboard.writeText(standingMemo(program.country, plan))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-mp-md border border-mp-border bg-section/40 p-3">
      <p className="font-chrome text-[11px] font-semibold uppercase tracking-wide text-mp-ink-secondary">
        Standing gap fund
      </p>
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-mp-ink">
        {plan.missing} {plan.missing === 1 ? 'gap' : 'gaps'} × {formatSatsExact(plan.bountySats)} ={' '}
        <span className="text-mp-btc-text">{formatSatsExact(plan.monthlySats)}/month</span>
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-mp-ink-tertiary">
        That is every open gap tipped once a month. It is arithmetic on the suggested tip, not a quote, and it buys
        research time — not a finding.
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void copyMemo()}
          className="inline-flex items-center gap-1 rounded-full border border-mp-border px-2.5 py-1 font-chrome text-[11px] text-mp-ink-secondary hover:border-mp-btc/40 hover:text-mp-btc-text"
        >
          {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy standing memo'}
        </button>
      </div>

      <div className="mt-3 border-t border-mp-border-subtle pt-2">
        {offer?.ok && deepLink ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <PaymentQrCode value={deepLink} label="BOLT12 offer" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="font-mono text-[10px] break-all text-mp-ink-tertiary">{shortOffer(offer.offer.offer)}</p>
              <a href={deepLink} className="text-[11px] text-accent hover:underline">
                Open in a BOLT12-capable wallet
              </a>
              <p className="text-[10px] leading-relaxed text-mp-ink-tertiary">
                The checksum is valid; only your wallet can read the offer&apos;s fields and recurrence. MotoPass
                cannot charge it, and recurrence is set in the wallet, not here.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[10px] leading-relaxed text-mp-ink-tertiary">
            {offer && !offer.ok
              ? `The configured offer is not payable: ${offer.error}.`
              : 'No BOLT12 offer is configured for this deployment, so there is nothing here a wallet could pay. The plan above is the amount an offer would need to cover.'}
          </p>
        )}
      </div>
    </div>
  )
}
