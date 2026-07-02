export type ApplicationStatus =
  | 'registered'
  | 'documents'
  | 'stamped'
  | 'agent_assigned'
  | 'submitted'
  | 'payment_pending'
  | 'in_review'
  | 'approved'

export type PaymentRail = 'bitcoin' | 'liquid' | 'lightning' | 'bolt12' | 'silent' | 'pynym'

export interface UserDocument {
  id: string
  name: string
  size: number
  type: string
  hash: string
  satohashUrl: string
  stampedAt: string
  status: 'uploading' | 'hashed' | 'stamped'
}

export interface UserPayment {
  id: string
  rail: PaymentRail
  amountSats: number
  amountUsd?: number
  status: 'pending' | 'confirmed' | 'failed'
  txId?: string
  createdAt: string
  label: string
}

export interface UserProfile {
  npub: string
  pubkey: string
  displayName?: string
  program: string
  country: string
  agentId: string
  agentName: string
  status: ApplicationStatus
  registeredAt: string
  documents: UserDocument[]
  payments: UserPayment[]
  notes?: string
}

export const STATUS_STEPS: { key: ApplicationStatus; label: string }[] = [
  { key: 'registered', label: 'Registered' },
  { key: 'documents', label: 'Documents uploaded' },
  { key: 'stamped', label: 'Satohash stamped' },
  { key: 'agent_assigned', label: 'Agent assigned' },
  { key: 'submitted', label: 'Application submitted' },
  { key: 'payment_pending', label: 'Payment' },
  { key: 'in_review', label: 'In review' },
  { key: 'approved', label: 'Approved' },
]

export const PAYMENT_RAILS: { id: PaymentRail; label: string; desc: string }[] = [
  { id: 'bitcoin', label: 'Bitcoin', desc: 'On-chain BTC' },
  { id: 'liquid', label: 'Liquid Bitcoin', desc: 'L-BTC confidential' },
  { id: 'lightning', label: 'Lightning', desc: 'Instant L2 sats' },
  { id: 'bolt12', label: 'BOLT12', desc: 'Offer-based Lightning' },
  { id: 'silent', label: 'Silent Payments', desc: 'BIP352 private receive' },
  { id: 'pynym', label: 'PYNYM', desc: 'Privacy payment layer' },
]