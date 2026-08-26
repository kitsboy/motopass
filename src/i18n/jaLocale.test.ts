import { describe, it, expect } from 'vitest'
import { registerDict } from './translations'
import { loadLocale } from './locales'
import { pageKeysEn } from './pageKeys/en'

// Japanese FULL locale regression: the ja dict must define *every* page key and
// *every* base/menu key itself, so `t('ja', key)` never falls back to English.
// A missing key here would silently render English on the live site.

describe('ja locale (FULL)', () => {
  it('fully localizes every page key — no English fallback', async () => {
    const dict = await loadLocale('ja')
    expect(dict).toBeTruthy()
    registerDict('ja', dict!)
    // The ja dict no longer spreads pageKeysEn — it must *define* every page key
    // itself. A missing key here would silently fall back to English.
    const jaKeys = new Set(Object.keys(dict!))
    for (const key of Object.keys(pageKeysEn)) {
      expect(jaKeys.has(key), `ja page key ${key} missing — would fall back to English`).toBe(true)
    }
  })

  it('localizes the command-center menu keys (no English fallback)', async () => {
    const dict = await loadLocale('ja')
    expect(dict).toBeTruthy()
    registerDict('ja', dict!)
    const menuKeys = [
      'menu.live', 'menu.liveBTC', 'menu.liveBlock', 'menu.liveFresh', 'menu.quickActions',
      'menu.stamp', 'menu.verify', 'menu.apply', 'menu.searchNoResults', 'menu.searchAll',
      'menu.featured', 'menu.trustSummary', 'menu.trustPending', 'menu.viewTrust',
    ] as const
    const jaKeys = new Set(Object.keys(dict!))
    for (const key of menuKeys) {
      expect(jaKeys.has(key), `ja ${key} missing — would fall back to English`).toBe(true)
    }
    // Genuine Japanese phrases (canonical terms like BTC stay identical).
    expect(dict!['menu.quickActions']).toBe('クイックアクション')
    expect(dict!['menu.viewTrust']).toBe('ライブ信頼')
    expect(dict!['menu.trustSummary']).toContain('最新')
    expect(dict!['menu.searchNoResults']).toContain('一致するプログラム')
  })

  it('localizes every hero-tagline fragment (no English in the h1)', async () => {
    const dict = await loadLocale('ja')
    expect(dict).toBeTruthy()
    registerDict('ja', dict!)
    const heroKeys = [
      'pitch.heroTagline.line1', 'pitch.heroTagline.line2prefix',
      'pitch.heroTagline.line2accent', 'pitch.heroTagline.line3neg',
      'pitch.heroTagline.line3struck',
    ] as const
    const JA = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u
    for (const key of heroKeys) {
      const val = dict![key]
      expect(typeof val).toBe('string')
      expect(val, `ja hero fragment ${key} must contain Japanese script`).toMatch(JA)
    }
  })

  it('defines every base translation key so core pages render Japanese', async () => {
    const dict = await loadLocale('ja')
    expect(dict).toBeTruthy()
    registerDict('ja', dict!)
    // Core page strings must be genuinely Japanese, not silent English fallbacks.
    expect(dict!['nav.pitch']).toBe('ピッチ')
    expect(dict!['trust.title']).toBe('ライブトラストカード')
    expect(dict!['programs.title']).toContain('プログラム')
    expect(dict!['simulator.title']).toContain('スタッキング')
  })
})
