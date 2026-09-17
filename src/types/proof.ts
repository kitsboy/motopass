/** OTS / Satohash verify result for Vault UI */
export interface VerifyResult {
  verified: boolean
  hash: string
  mode: 'opentimestamps' | 'structural' | 'hash-only' | 'failed' | 'chain'
  blockTime: string | null
  message: string
  /** Chain-resolved fields — present only when mode === 'chain'. */
  chainState?: 'confirmed' | 'pending' | 'not-proven' | null
  verifiedMethod?: 'bitcoind' | 'esplora' | null
  blockHeight?: number | null
  otsUrl?: string | null
  reason?: string | null
  offline?: boolean
}
