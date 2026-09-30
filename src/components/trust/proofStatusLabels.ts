export interface ProofStatusLabels {
  provenNowHeading: string
  validNowHeading: string
  provenConfirmed: string
  provenPending: string
  provenNotProven: string
  validCurrent: string
  validUnconfirmed: string
  validRevoked: string
  asOf: string
  splitNote: string
  unknown: string
}

export const DEFAULT_PROOF_STATUS_LABELS: ProofStatusLabels = {
  provenNowHeading: 'Proven then',
  validNowHeading: 'Valid now',
  provenConfirmed: 'Anchored to Bitcoin · block {block}',
  provenPending: 'Recorded, not yet anchored',
  provenNotProven: 'Not proven',
  validCurrent: 'Current as of {checked}',
  validUnconfirmed: 'Unconfirmed as of {checked} — check the live registry',
  validRevoked: 'Revoked / expired',
  asOf: 'as of {checked}',
  splitNote:
    'The proof never expires — it only ever says when this existed. Whether it is still valid today is a separate, live check, and MotoPass never merges the two.',
  unknown: 'not checked yet',
}
