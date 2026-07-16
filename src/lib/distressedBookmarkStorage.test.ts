import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadDistressedBookmarks,
  saveDistressedBookmarks,
  toggleDistressedBookmark,
  isDistressedBookmarked,
  DISTRESSED_BOOKMARKS_KEY,
} from './distressedBookmarkStorage'

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

describe('distressedBookmarkStorage', () => {
  it('toggles bookmarks', () => {
    expect(toggleDistressedBookmark('uy-rbi')).toEqual(['uy-rbi'])
    expect(toggleDistressedBookmark('uy-rbi')).toEqual([])
    expect(storage[DISTRESSED_BOOKMARKS_KEY]).toBeTruthy()
  })

  it('dedupes on save', () => {
    saveDistressedBookmarks(['a', 'a', 'b'])
    expect(loadDistressedBookmarks()).toEqual(['a', 'b'])
  })

  it('checks bookmark membership', () => {
    saveDistressedBookmarks(['x'])
    expect(isDistressedBookmarked('x')).toBe(true)
    expect(isDistressedBookmarked('y')).toBe(false)
  })
})