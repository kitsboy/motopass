import { describe, it, expect } from 'vitest'
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'
import { buildTipReceipt, type ReceiptPublishResult } from './tipReceipt'
import {
  TIP_RECEIPT_KEY,
  clearTipReceipts,
  loadTipReceipts,
  mergeTipReceipts,
  removeTipReceipt,
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

describe('removeTipReceipt and mergeTipReceipts', () => {
  it('removes one receipt and keeps the rest', () => {
    const storage = memoryStorage()
    saveTipReceipt(published(), storage)
    saveTipReceipt(published('c'.repeat(64), 2_000), storage)
    const target = loadTipReceipts(storage)[0]

    const result = removeTipReceipt(target.id, storage)
    expect(result.ok).toBe(true)
    expect(result.receipts.map(receipt => receipt.id)).not.toContain(target.id)
    expect(loadTipReceipts(storage)).toHaveLength(1)

    expect(removeTipReceipt('missing', storage)).toEqual({ ok: true, receipts: loadTipReceipts(storage) })
  })

  it('merges verified receipts, ignores tampered ones and counts only new ones', () => {
    const storage = memoryStorage()
    saveTipReceipt(published(), storage)
    const existing = (JSON.parse(storage.dump()[TIP_RECEIPT_KEY]) as Record<string, unknown>[])[0]
    const fresh = JSON.parse(published('e'.repeat(64), 3_000).json) as Record<string, unknown>

    const merged = mergeTipReceipts([fresh, existing, { ...fresh, content: 'rewritten' }], storage)
    expect(merged.ok).toBe(true)
    if (!merged.ok) return
    expect(merged.added).toBe(1)
    expect(merged.receipts.map(receipt => receipt.paymentHash)).toContain('e'.repeat(64))
    expect(merged.receipts).toHaveLength(2)
    expect(loadTipReceipts(storage)).toHaveLength(2)
  })

  it('caps a merge at twenty and reports nothing new for an empty list', () => {
    const storage = memoryStorage()
    for (let index = 0; index < 20; index += 1) {
      saveTipReceipt(published(index.toString(16).padStart(64, '0')), storage)
    }
    const extra = Array.from({ length: 5 }, (_, index) =>
      JSON.parse(published((index + 100).toString(16).padStart(64, '0')).json),
    )
    const merged = mergeTipReceipts(extra, storage)
    expect(merged.ok).toBe(true)
    if (!merged.ok) return
    expect(merged.receipts).toHaveLength(20)
    expect(merged.added).toBe(5)

    expect(mergeTipReceipts([], storage)).toMatchObject({ ok: true, added: 0 })
  })

  it('refuses to merge with no storage at all', () => {
    expect(mergeTipReceipts([], null)).toEqual({
      ok: false,
      error: 'This browser does not allow local storage',
    })
  })
})
