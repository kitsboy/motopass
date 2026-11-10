import { getLightningAddress } from './payments'

/**
 * A gap bounty is a tip toward research time, not a purchase order. Nothing
 * here promises a finding, a date or a favourable answer: a fact becomes
 * "on file" only when an official source is read, and a tip does not change
 * what that source says.
 */
export const SUGGESTED_GAP_BOUNTY_SATS = 5000

export interface GapBounty {
  factKey: string
  sats: number
  /** Lightning Address that receives the tip. */
  address: string
  /** Wallet-native fallback when LNURL resolution fails. */
  walletUri: string
}

export function bountyAddress(): string {
  return getLightningAddress()
}

/** Null when no real Lightning Address is configured — no fake invoices. */
export function gapBounty(factKey: string, address: string = bountyAddress()): GapBounty | null {
  const trimmed = address.trim()
  if (!trimmed || !trimmed.includes('@') || trimmed.includes('...')) return null
  return {
    factKey,
    sats: SUGGESTED_GAP_BOUNTY_SATS,
    address: trimmed,
    walletUri: `lightning:${trimmed}?amount=${SUGGESTED_GAP_BOUNTY_SATS * 1000}`,
  }
}

/** Comment sent with the invoice request when the server allows one. */
export function bountyMemo(factKey: string, programName: string): string {
  return `MotoPass gap: ${programName} ${factKey.replace(/_/g, ' ')}`.slice(0, 120)
}
