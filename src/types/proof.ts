/** OTS / Satohash verify result for Vault UI */
export interface VerifyResult {
  verified: boolean
  hash: string
  mode: 'opentimestamps' | 'structural' | 'hash-only' | 'failed'
  blockTime: string | null
  message: string
}