import { describe, it, expect } from 'vitest'
import { t, registerDict } from './translations'
import { loadLocale } from './locales'

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
})
