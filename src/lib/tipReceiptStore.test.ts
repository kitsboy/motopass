import { describe, it, expect } from 'vitest'
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'
import { buildTipReceipt, type ReceiptPublishResult } from './tipReceipt'
import {
  TIP_RECEIPT_KEY,
  clearTipReceipts,
  loadTipReceipts,
  saveTipReceipt,
  storedReceiptHashes,
  toStoredTipReceipt,
  type ReceiptStorage,
} from './tipReceiptStore'

const HASH = 'a'.repeat(64)
const PREIMAGE = 'b'.repeat(64)

function memoryStorage(initial: Record<string, string> = {}): ReceiptStorage & { dump: () => Record<string, string> } {
  const map = new Map(Object.entries(initial))
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: key => {
      map.delete(key)
    },
    dump: () => Object.fromEntries(map),
  }
}

function published(paymentHash = HASH, sats = 5_000): ReceiptPublishResult {
  const built = buildTipReceipt({
    program: 'Panama',
    factKey: 'gov_fees',
    sats,
    paymentHash,
    preimage: PREIMAGE,
    settledAt: 1_760_000_100,
    createdAt: 1_760_000_100,
  })
  if (!built.ok) throw new Error(built.error)
  const signed = finalizeEvent(
    {
      kind: 30078,
      created_at: built.event.created_at,
      tags: built.event.tags,
      content: built.event.content,
    },
    generateSecretKey(),
  )
  return { status: 'published', event: built.event, json: JSON.stringify(signed) }
}

describe('saveTipReceipt', () => {
  it('stores a signed receipt and reads it back with its cached fields', () => {
    const storage = memoryStorage()
    const result = saveTipReceipt(published(), storage)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const loaded = loadTipReceipts(storage)
    expect(loaded).toHaveLength(1)
    expect(loaded[0]).toMatchObject({
      paymentHash: HASH,
      program: 'Panama',
      field: 'gov_fees',
      sats: 5_000,
      kind: 30078,
    })
    expect(storedReceiptHashes(loaded)).toEqual([HASH])
  })

  it('refuses unsigned and rejected results', () => {
    const storage = memoryStorage()
    const unsigned = { ...published(), status: 'unsigned' as const, json: JSON.stringify({ kind: 30078 }) }
    expect(saveTipReceipt(unsigned, storage)).toEqual({
      ok: false,
      error: 'Only a signed receipt can be saved on this device',
    })
    const rejected = { ...published(), status: 'rejected' as const }
    expect(saveTipReceipt(rejected, storage).ok).toBe(false)
    expect(loadTipReceipts(storage)).toEqual([])
  })

  it('de-duplicates by event id and keeps the newest first', () => {
    const storage = memoryStorage()
    const first = published()
    const second = published('c'.repeat(64), 2_000)
    saveTipReceipt(first, storage)
    saveTipReceipt(second, storage)
    saveTipReceipt(first, storage)

    const loaded = loadTipReceipts(storage)
    expect(loaded).toHaveLength(2)
    expect(loaded.map(receipt => receipt.paymentHash)).toEqual([HASH, 'c'.repeat(64)])
    expect(storedReceiptHashes(loaded)).toHaveLength(2)
  })

  it('caps the list at twenty receipts', () => {
    const storage = memoryStorage()
    for (let index = 0; index < 23; index += 1) {
      saveTipReceipt(published(index.toString(16).padStart(64, '0')), storage)
    }
    expect(loadTipReceipts(storage)).toHaveLength(20)
  })

  it('reports a browser that refuses to store', () => {
    const storage: ReceiptStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => {},
    }
    expect(saveTipReceipt(published(), storage)).toEqual({
      ok: false,
      error: 'This browser refused to store the receipt',
    })
  })

  it('reports a browser with no storage at all', () => {
    expect(saveTipReceipt(published(), null)).toEqual({
      ok: false,
      error: 'This browser does not allow local storage',
    })
    expect(loadTipReceipts(null)).toEqual([])
  })
})

describe('toStoredTipReceipt', () => {
  it('refuses a tampered signature and a badge-shaped object', () => {
    const signed = JSON.parse(published().json) as Record<string, unknown>
    expect(toStoredTipReceipt({ ...signed, content: 'rewritten' })).toBeNull()
    expect(toStoredTipReceipt({ ...signed, kind: 1 })).toBeNull()
    expect(toStoredTipReceipt({ id: 'x' })).toBeNull()
  })
})

describe('loadTipReceipts', () => {
  it('survives corrupt JSON and non-array payloads', () => {
    expect(loadTipReceipts(memoryStorage({ [TIP_RECEIPT_KEY]: 'not json{' }))).toEqual([])
    expect(loadTipReceipts(memoryStorage({ [TIP_RECEIPT_KEY]: '{"id":"x"}' }))).toEqual([])
  })

  it('drops entries that no longer verify but keeps the valid ones', () => {
    const storage = memoryStorage()
    saveTipReceipt(published(), storage)
    const stored = JSON.parse(storage.dump()[TIP_RECEIPT_KEY]) as Record<string, unknown>[]
    storage.setItem(TIP_RECEIPT_KEY, JSON.stringify([{ ...stored[0], sig: 'f'.repeat(128) }, stored[0]]))
    expect(loadTipReceipts(storage)).toHaveLength(1)
  })

  it('clears the key without throwing', () => {
    const storage = memoryStorage()
    saveTipReceipt(published(), storage)
    clearTipReceipts(storage)
    expect(storage.dump()[TIP_RECEIPT_KEY]).toBeUndefined()
  })
})
