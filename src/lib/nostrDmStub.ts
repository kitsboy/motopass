import { nip19 } from 'nostr-tools'
import { getPrimaryNostrRelay, MOTOPASS_RELAYS } from './nostr'

/** Deterministic stub event id for agent DM copy (not a real published event). */
export function stubDmEventId(agentId: string): string {
  const hex = Array.from({ length: 64 }, (_, i) => {
    const code = (agentId.charCodeAt(i % agentId.length) + i * 7) % 16
    return code.toString(16)
  }).join('')
  return hex
}

/** Stub hex pubkey paired with agent id (not a real key). */
export function stubAgentPubkey(agentId: string): string {
  return stubDmEventId(`pub-${agentId}`)
}

/** Kind-14 DM handoff stub encoded as `nevent1…` for clipboard copy. */
export function buildAgentDmNevent(agentId: string, _npub: string, _country: string): string {
  const relays = [getPrimaryNostrRelay(), ...MOTOPASS_RELAYS.slice(1)]
  return nip19.neventEncode({
    id: stubDmEventId(agentId),
    kind: 14,
    author: stubAgentPubkey(agentId),
    relays: [...new Set(relays)],
  })
}

export function buildAgentDmCopyText(agentId: string, npub: string, country: string): string {
  const nevent = buildAgentDmNevent(agentId, npub, country)
  return `nostr:${nevent}\n# MotoPass agent DM stub — ${country}\n# Paste into a Nostr client to open the thread (publish stub)`
}