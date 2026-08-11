import type { PaymentRail } from '../types/user'
import { SERVER_COSTS } from '../data/serverCosts'

export interface PaymentInvoice {
  id: string
  rail: PaymentRail
  amountSats: number
  bolt11?: string
  bolt12Offer?: string
  liquidAddress?: string
  silentPaymentAddress?: string
  onchainAddress?: string
  pynymHandle?: string
  /** Live Lightning Address (user@domain) when rail is lightning */
  lightningAddress?: string
  /** Ready-to-scan URI for Lightning Address / BOLT11 / on-chain */
  qrPayload?: string
  /** true when invoice uses demo placeholders (no live node env) */
  demo?: boolean
  status: 'pending' | 'confirmed'
  createdAt: string
}

/** Live Lightning Address — env override, else Give A Bit server tip address. */
export function getLightningAddress(): string {
  const fromEnv = (import.meta.env.VITE_LIGHTNING_ADDRESS as string | undefined)?.trim()
  if (fromEnv) return fromEnv
  return SERVER_COSTS.layer2.address
}

export function getOnchainDonationAddress(): string {
  const fromEnv = (import.meta.env.VITE_ONCHAIN_ADDRESS as string | undefined)?.trim()
  if (fromEnv) return fromEnv
  return SERVER_COSTS.layer1.address
}

/** True when a real Lightning Address is configured (not a fake demo bolt11). */
export function hasLiveLightning(): boolean {
  const addr = getLightningAddress()
  return Boolean(addr && addr.includes('@') && !addr.includes('...'))
}

/**
 * Create a payment invoice for the selected rail.
 * Lightning + on-chain use live family addresses when available; other rails remain demo stubs
 * until BOLT12 / Liquid / Silent nodes are wired.
 */
export function createPaymentInvoice(
  rail: PaymentRail,
  amountSats: number,
  _label: string,
): PaymentInvoice {
  const id = `inv-${Date.now()}-${rail}`
  const base = {
    id,
    rail,
    amountSats,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  }

  switch (rail) {
    case 'lightning': {
      const address = getLightningAddress()
      const live = hasLiveLightning()
      // Lightning Address QR: lightning:user@domain (wallets resolve LNURL-pay)
      const qrPayload = live
        ? `lightning:${address}${amountSats > 0 ? `?amount=${amountSats * 1000}` : ''}`
        : undefined
      return {
        ...base,
        bolt11: live ? undefined : `lnbc${amountSats}n1p${id.slice(-8)}...demo`,
        lightningAddress: live ? address : undefined,
        qrPayload: qrPayload ?? `lightning:demo-${id}`,
        demo: !live,
      }
    }
    case 'bolt12':
      return {
        ...base,
        bolt12Offer: `lno1p${id.slice(-12)}...offer`,
        qrPayload: `lno1p${id.slice(-12)}...offer`,
        demo: true,
      }
    case 'liquid':
      return { ...base, liquidAddress: `VJL...${id.slice(-6)}`, demo: true }
    case 'silent':
      return { ...base, silentPaymentAddress: `sp1q...${id.slice(-8)}`, demo: true }
    case 'pynym':
      return { ...base, pynymHandle: `@motopass-${id.slice(-6)}`, demo: true }
    default: {
      const address = getOnchainDonationAddress()
      const live = Boolean(address && address.startsWith('bc1') && !address.includes('...'))
      return {
        ...base,
        onchainAddress: address,
        qrPayload: live ? `bitcoin:${address}` : undefined,
        demo: !live,
      }
    }
  }
}

/** @deprecated use createPaymentInvoice */
export function createInvoicePlaceholder(
  rail: PaymentRail,
  amountSats: number,
  label: string,
): PaymentInvoice {
  return createPaymentInvoice(rail, amountSats, label)
}