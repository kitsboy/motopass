import { describe, it, expect, beforeEach } from 'vitest'
import {
  dismissPaigeEnforcement,
  isPaigeEnforcementDismissed,
  resetPaigeEnforcementDismiss,
} from './paigeEnforcementDismiss'

beforeEach(() => {
  const store: Record<string, string> = {}
  globalThis.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    key: () => null,
    length: 0,
  }
})

describe('paigeEnforcementDismiss', () => {
  it('tracks dismiss state in localStorage', () => {
    expect(isPaigeEnforcementDismissed()).toBe(false)
    dismissPaigeEnforcement()
    expect(isPaigeEnforcementDismissed()).toBe(true)
    resetPaigeEnforcementDismiss()
    expect(isPaigeEnforcementDismissed()).toBe(false)
  })
})