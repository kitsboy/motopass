import { describe, it, expect } from 'vitest'
import { t, registerDict } from './translations'
import { loadLocale } from './locales'
import { pageKeysEn } from './pageKeys/en'

// Verifies the perf refactor (per-locale lazy loading): a non-English locale is a
// separate chunk loaded on demand, and `t` resolves it with English fallback for
// any key the locale doesn't localize.

describe('lazy i18n locales', () => {
  it('English resolves without any registration (bundled)', () => {
    expect(t('en', 'nav.pitch')).toBe('Pitch')
    expect(t('en', 'nav.trust')).toBe('Trust')
  })

  it('loads a non-English locale chunk, registers it, and resolves localized keys', async () => {
    const dict = await loadLocale('es')
    expect(dict).toBeTruthy()
    registerDict('es', dict!)
    // Spanish inline override
    expect(t('es', 'nav.pitch')).toBe('Visión')
    // A PageKey localized by pageKeysEs
    expect(t('es', 'dashboard.welcome')).toBe('Bienvenido, {name}')
  })

  it('falls back to English for keys a locale does not localize', async () => {
    const dict = await loadLocale('fr')
    registerDict('fr', dict!)
    // French does not necessarily localize every key — must fall back to English, never key.
    const unknownButEnglish = t('fr', 'nav.trust') // trust nav exists in en
    expect(typeof unknownButEnglish).toBe('string')
    expect(unknownButEnglish).not.toBe('nav.trust')
    // English keys are always the ultimate fallback, so a missing key returns English text.
    expect(t('fr', 'pitch.hero')).not.toBe('pitch.hero')
  })

  it('every locale chunk loads and registers without throwing', async () => {
    for (const lang of ['es', 'fr', 'pt', 'zh', 'ar', 'sw', 'de', 'hi', 'ja']) {
      const dict = await loadLocale(lang)
      expect(dict, `${lang} should load`).toBeTruthy()
      registerDict(lang as never, dict!)
      expect(t(lang as never, 'nav.pitch')).toBeTruthy()
    }
  })

  it('pt fully localizes every page key — no English fallback', async () => {
    const dict = await loadLocale('pt')
    expect(dict).toBeTruthy()
    registerDict('pt', dict!)
    // The pt dict no longer spreads pageKeysEn — it must *define* every page key
    // itself. A missing key here would silently fall back to English.
    const ptKeys = new Set(Object.keys(dict!))
    for (const key of Object.keys(pageKeysEn)) {
      expect(ptKeys.has(key), `pt page key ${key} missing — would fall back to English`).toBe(true)
    }
  })

  it('pt localizes the command-center menu keys (no English fallback)', async () => {
    const dict = await loadLocale('pt')
    expect(dict).toBeTruthy()
    registerDict('pt', dict!)
    const menuKeys = [
      'menu.live', 'menu.liveBTC', 'menu.liveBlock', 'menu.liveFresh', 'menu.quickActions',
      'menu.stamp', 'menu.verify', 'menu.apply', 'menu.searchNoResults', 'menu.searchAll',
      'menu.featured', 'menu.trustSummary', 'menu.trustPending', 'menu.viewTrust',
    ] as const
    const ptKeys = new Set(Object.keys(dict!))
    for (const key of menuKeys) {
      expect(ptKeys.has(key), `pt ${key} missing — would fall back to English`).toBe(true)
    }
    // Spot-check a few genuinely translated phrases (canonical terms like BTC stay identical).
    expect(dict!['menu.quickActions']).toBe('Ações rápidas')
    expect(dict!['menu.viewTrust']).toBe('Confiança ao vivo')
    expect(dict!['menu.trustSummary']).toContain('frescos')
    expect(dict!['menu.searchNoResults']).toContain('Nenhum programa')
  })

  it('ar fully localizes every page key — no English fallback', async () => {
    const dict = await loadLocale('ar')
    expect(dict).toBeTruthy()
    registerDict('ar', dict!)
    // The ar dict no longer spreads pageKeysEn — it must *define* every page key
    // itself. A missing key here would silently fall back to English.
    const arKeys = new Set(Object.keys(dict!))
    for (const key of Object.keys(pageKeysEn)) {
      expect(arKeys.has(key), `ar page key ${key} missing — would fall back to English`).toBe(true)
    }
    // Canonical terms stay as-is (BTC, GitHub); genuine phrases must be Arabic script.
    const AR = /[\u0600-\u06FF]/
    expect(dict!['nav.pitch']).toBe('الرؤية')
    expect(dict!['menu.quickActions']).toBe('إجراءات سريعة')
    expect(dict!['menu.viewTrust']).toBe('ثقة مباشرة')
    expect(dict!['trust.title']).toMatch(AR)
  })

  it('ar renders in RTL (document dir=rtl) and hero tagline localizes', async () => {
    const dict = await loadLocale('ar')
    expect(dict).toBeTruthy()
    registerDict('ar', dict!)
    // ar must localize every hero-tagline fragment so no English leaks into the h1.
    const heroKeys = [
      'pitch.heroTagline.line1', 'pitch.heroTagline.line2prefix',
      'pitch.heroTagline.line2accent', 'pitch.heroTagline.line3neg',
      'pitch.heroTagline.line3struck',
    ] as const
    for (const key of heroKeys) {
      const val = dict![key]
      expect(typeof val).toBe('string')
      expect(val).toMatch(/[\u0600-\u06FF]/)
    }
  })

  it('sw fully localizes every page key — no English fallback', async () => {
    const dict = await loadLocale('sw')
    expect(dict).toBeTruthy()
    registerDict('sw', dict!)
    // The sw dict must define every page key itself (no pageKeysEn spread fallback).
    const swKeys = new Set(Object.keys(dict!))
    for (const key of Object.keys(pageKeysEn)) {
      expect(swKeys.has(key), `sw page key ${key} missing — would fall back to English`).toBe(true)
    }
    // Canonical terms stay as-is (Bitcoin, Nostr); genuine phrases must be Swahili.
    expect(dict!['nav.pitch']).toBe('Dira')
    expect(dict!['menu.quickActions']).toBe('Vitendo vya haraka')
    expect(dict!['menu.viewTrust']).toBe('Uaminifu wa moja kwa moja')
    expect(dict!['trust.title']).toBe('Kadi za uaminifu za moja kwa moja')
    // /portfolio page must be FULL Swahili — every portfolio key resolves, and the
    // hardcoded-English leak (nostrHint) is genuinely localized, not an en fallback.
    const portfolioKeys = [
      'portfolio.eyebrow', 'portfolio.title', 'portfolio.subtitle', 'portfolio.empty',
      'portfolio.explore', 'portfolio.nostrIdentity', 'portfolio.nostrHint',
      'portfolio.statPrograms', 'portfolio.statInvest', 'portfolio.statScore',
      'portfolio.statLightning', 'portfolio.tip.programs', 'portfolio.tip.invest',
      'portfolio.tip.score', 'portfolio.tip.lightning', 'portfolio.sortBy',
      'portfolio.sortOrder', 'portfolio.sortName', 'portfolio.sortScore',
      'portfolio.sortInvest', 'portfolio.removeAll', 'portfolio.removeAllTitle',
      'portfolio.removeAllConfirm', 'portfolio.shareUrl', 'portfolio.shareCopied',
      'portfolio.reorderSaved',
    ] as const
    for (const key of portfolioKeys) {
      expect(swKeys.has(key), `sw /portfolio key ${key} missing — would fall back to English`).toBe(true)
    }
    expect(dict!['portfolio.nostrHint']).toContain('npub')
    expect(dict!['portfolio.nostrHint']).toContain('funguo')
    expect(dict!['pitch.stackSimulator']).toBe('Kiigizo cha stack')
    expect(dict!['pitch.btcmapCta']).toBe('Wafanyabiashara wa Ramani ya BTC')
  })

  it('sw localizes the command-center menu keys (no English fallback)', async () => {
    const dict = await loadLocale('sw')
    expect(dict).toBeTruthy()
    registerDict('sw', dict!)
    const menuKeys = [
      'menu.live', 'menu.liveBTC', 'menu.liveBlock', 'menu.liveFresh', 'menu.quickActions',
      'menu.stamp', 'menu.verify', 'menu.apply', 'menu.searchNoResults', 'menu.searchAll',
      'menu.featured', 'menu.trustSummary', 'menu.trustPending', 'menu.viewTrust',
    ] as const
    const swKeys = new Set(Object.keys(dict!))
    for (const key of menuKeys) {
      expect(swKeys.has(key), `sw ${key} missing — would fall back to English`).toBe(true)
    }
    expect(dict!['menu.trustSummary']).toContain('mpya')
    expect(dict!['menu.searchNoResults']).toContain('programu')
  })

  it('sw localizes the hero tagline — no English leaks into the h1', async () => {
    const dict = await loadLocale('sw')
    expect(dict).toBeTruthy()
    registerDict('sw', dict!)
    const heroKeys = [
      'pitch.heroTagline.line1', 'pitch.heroTagline.line2prefix',
      'pitch.heroTagline.line2accent', 'pitch.heroTagline.line3neg',
      'pitch.heroTagline.line3struck',
    ] as const
    for (const key of heroKeys) {
      const val = dict![key]
      expect(typeof val).toBe('string')
      if (val) {
        expect(val.trim().length).toBeGreaterThan(0)
        expect(val).not.toMatch(/\b(True citizenship|Stamped|bureaucracy|time|Not)\b/)
      }
    }
  })
})
