import { BUILD_ID, BUILD_LABEL } from './buildInfo'
import type { Program } from '../types/program'

export type VaultCredentialBundle = {
  schema: 'motopass-credential/v1'
  build: string
  build_label: string
  exported_at: string
  issuer: 'MotoPass Vault'
  credentials: {
    program_id: number
    program_name: string
    region: string
    status: string
    last_checked: string
    proofs: {
      field: string
      content_hash?: string
      block_height?: number
      proof_url?: string
      ots_path?: string
      stamped_at?: string
    }[]
  }[]
}

export function buildVaultCredentialBundle(programs: Program[]): VaultCredentialBundle {
  const stamped = programs.filter(p => p.satohash_proofs?.length)

  return {
    schema: 'motopass-credential/v1',
    build: BUILD_ID,
    build_label: BUILD_LABEL,
    exported_at: new Date().toISOString(),
    issuer: 'MotoPass Vault',
    credentials: stamped.map(p => ({
      program_id: p.id,
      program_name: p.name,
      region: p.region,
      status: p.status,
      last_checked: p.last_checked,
      proofs: (p.satohash_proofs ?? []).map(proof => ({
        field: proof.field,
        content_hash: proof.content_hash,
        block_height: proof.block_height,
        proof_url: proof.proof_url,
        ots_path: proof.ots_path,
        stamped_at: proof.stamped_at,
      })),
    })),
  }
}

export function downloadVaultCredentials(programs: Program[]): void {
  const bundle = buildVaultCredentialBundle(programs)
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `motopass-credentials-${BUILD_ID}.json`
  a.click()
  URL.revokeObjectURL(url)
}