import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadApplyDraft,
  saveApplyDraft,
  clearApplyDraft,
  applyFormCompletion,
  APPLY_DRAFT_KEY,
} from './applyDraftStorage'

const storage: Record<string, string> = {}

beforeEach(() => {
  Object.keys(storage).forEach(k => delete storage[k])
  globalThis.localStorage = {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => { storage[k] = v },
    removeItem: (k: string) => { delete storage[k] },
    clear: () => Object.keys(storage).forEach(k => delete storage[k]),
    key: () => null,
    length: 0,
  }
})

describe('applyDraftStorage', () => {
  it('round-trips draft fields', () => {
    saveApplyDraft({ name: 'Cam', program: 'Uruguay', notes: 'RBI route' })
    const draft = loadApplyDraft()
    expect(draft?.name).toBe('Cam')
    expect(draft?.program).toBe('Uruguay')
    expect(draft?.notes).toBe('RBI route')
    expect(draft?.savedAt).toBeTruthy()
  })

  it('clears draft on submit', () => {
    saveApplyDraft({ name: 'A', program: 'B', notes: '' })
    clearApplyDraft()
    expect(loadApplyDraft()).toBeNull()
    expect(storage[APPLY_DRAFT_KEY]).toBeUndefined()
  })

  it('computes completion percentage', () => {
    expect(applyFormCompletion({ name: '', program: '', notes: '', hasNostr: false })).toBe(0)
    expect(applyFormCompletion({ name: 'Cam', program: 'UY', notes: '', hasNostr: false })).toBe(80)
    expect(applyFormCompletion({ name: 'Cam', program: 'UY', notes: 'hi', hasNostr: true })).toBe(100)
  })
})