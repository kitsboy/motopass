import { SimplePool, type Event } from 'nostr-tools'
import { MOTOPASS_RELAYS } from './nostr'

const pool = new SimplePool()

export type PublishResult = { ok: boolean; relay: string; error?: string }

export async function publishEvent(event: Event): Promise<PublishResult[]> {
  const results: PublishResult[] = []
  for (const relay of MOTOPASS_RELAYS) {
    try {
      await Promise.race([
        pool.publish([relay], event),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
      ])
      results.push({ ok: true, relay })
    } catch (e) {
      results.push({ ok: false, relay, error: e instanceof Error ? e.message : 'failed' })
    }
  }
  return results
}

export function relayStatusSummary(results: PublishResult[]): string {
  const ok = results.filter((r) => r.ok).length
  return `${ok}/${results.length} relays accepted (stub-safe — UI never blocks on failure)`
}