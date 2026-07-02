import type { PaymentRail } from '../types/user'

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
  status: 'pending' | 'confirmed'
  createdAt: string
}

export function createInvoicePlaceholder(rail: PaymentRail, amountSats: number, _label: string): PaymentInvoice {
  const id = `inv-${Date.now()}-${rail}`
  const base = { id, rail, amountSats, status: 'pending' as const, createdAt: new Date().toISOString() }

  switch (rail) {
    case 'lightning':
      return { ...base, bolt11: `lnbc${amountSats}n1p${id.slice(-8)}...demo` }
    case 'bolt12':
      return { ...base, bolt12Offer: `lno1p${id.slice(-12)}...offer` }
    case 'liquid':
      return { ...base, liquidAddress: `VJL...${id.slice(-6)}` }
    case 'silent':
      return { ...base, silentPaymentAddress: `sp1q...${id.slice(-8)}` }
    case 'pynym':
      return { ...base, pynymHandle: `@motopass-${id.slice(-6)}` }
    default:
      return { ...base, onchainAddress: `bc1q...${id.slice(-8)}` }
  }
}