import { describe, expect, it, beforeEach } from 'vitest'
import {
  ROUTE_LANG_KEY,
  getRouteLang,
  readRouteLangMap,
  saveRouteLang,
  writeRouteLangMap,
} from './routeLangStorage'

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

describe('routeLangStorage', () => {

  it('round-trips per-route language preferences', () => {
    saveRouteLang('/programs', 'es')
    saveRouteLang('/vault', 'fr')
    expect(getRouteLang('/programs')).toBe('es')
    expect(getRouteLang('/vault')).toBe('fr')
    expect(localStorage.getItem(ROUTE_LANG_KEY)).toBeTruthy()
  })

  it('ignores invalid stored values', () => {
    writeRouteLangMap({ '/bad': 'zz' as never, '/ok': 'system' })
    expect(readRouteLangMap()).toEqual({ '/ok': 'system' })
  })
})