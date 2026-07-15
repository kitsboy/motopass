export type LaunchGate = {
  id: string
  pillar: string
  name: string
  pass: boolean
  detail: string
  blockers?: string[]
}

export type LaunchGateReport = {
  generated_at: string
  build_id: string
  applications_open: boolean
  relay?: string
  relay_fake?: boolean
  relay_status?: 'fake' | 'live'
  gates: LaunchGate[]
}

export const FALLBACK_LAUNCH_GATES: LaunchGateReport = {
  generated_at: '',
  build_id: 'pre-launch',
  applications_open: false,
  gates: [
    { id: 'G1', pillar: 'Seal', name: 'OTS + Satohash on all flagships', pass: false, detail: 'Run npm run launch:gate' },
    { id: 'G2', pillar: 'Forge', name: 'Distressed marketplace + proof vault UI', pass: false, detail: 'Pending scorecard' },
    { id: 'G3', pillar: 'Nexus', name: 'Live Nostr relay', pass: false, detail: 'relay.motopass.giveabit.io' },
    { id: 'G4', pillar: 'Ledger', name: 'Oracle seed + Kimi handoff', pass: false, detail: 'Pending scorecard' },
    { id: 'G5', pillar: 'Ops', name: 'CI validators + build', pass: false, detail: 'Pending scorecard' },
  ],
}

export async function fetchLaunchGates(): Promise<LaunchGateReport> {
  try {
    const res = await fetch('/launch-gates.json', { cache: 'no-store' })
    if (!res.ok) return FALLBACK_LAUNCH_GATES
    const data = (await res.json()) as LaunchGateReport
    if (!Array.isArray(data.gates)) return FALLBACK_LAUNCH_GATES
    return data
  } catch {
    return FALLBACK_LAUNCH_GATES
  }
}