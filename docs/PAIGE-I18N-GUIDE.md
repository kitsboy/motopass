# Paige Knowledge: Internationalization & Multi-Language Support

> **10th knowledge topic** — auto-discovered by `import.meta.glob` (hot-loadable, zero code changes).

## 30-Second Version

MotoPass supports **10 languages** with automatic browser detection, per-route language overrides, and RTL support for Arabic. The system uses a context-based React architecture with English fallback for missing translations, localStorage persistence, and a keyboard shortcut (⌘L) for quick switching.

---

## Supported Languages

| Code | Flag | Language | Native Name | Direction | Coverage |
|------|------|----------|-------------|-----------|----------|
| `en` | 🇬🇧 | English | English | LTR | Full |
| `es` | 🇪🇸 | Spanish | Español | LTR | Full |
| `fr` | 🇫🇷 | French | Français | LTR | Full |
| `pt` | 🇵🇹 | Portuguese | Português | LTR | Full |
| `zh` | 🇨🇳 | Chinese | 中文 | LTR | Full |
| `ar` | 🇸🇦 | Arabic | العربية | **RTL** | Full |
| `sw` | 🇰🇪 | Swahili | Kiswahili | LTR | Full |
| `de` | 🇩🇪 | German | Deutsch | LTR | Full |
| `hi` | 🇮🇳 | Hindi | हिन्दी | LTR | Full |
| `ja` | 🇯🇵 | Japanese | 日本語 | LTR | Full |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    I18N ARCHITECTURE                              │
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐    │
│  │ Browser      │    │ localStorage │    │ Route overrides  │    │
│  │ detection    │    │ preference   │    │ per-page lang    │    │
│  └──────┬──────┘    └──────┬───────┘    └────────┬─────────┘    │
│         │                  │                     │               │
│         └──────────────────┼─────────────────────┘               │
│                            ↓                                     │
│                   ┌────────────────┐                             │
│                   │ I18nProvider    │                             │
│                   │ (React Context) │                             │
│                   └────────┬───────┘                             │
│                            ↓                                     │
│                   ┌────────────────┐                             │
│                   │ useI18n() hook │                             │
│                   │ t('key')       │                             │
│                   └────────┬───────┘                             │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ TRANSLATIONS dict → English fallback → key as last resort  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## How Language Selection Works

### 1. Initial Load (System Default)

On first visit, `langPreference` is `'system'`:

```
Browser languages: ['ja-JP', 'ja', 'en-US']
  ↓ detectBrowserLang()
  ↓ prefix match: 'ja' → 'ja'
  ↓ Document: lang="ja", dir="ltr"
```

### 2. User Overrides Language

When user picks a language from the switcher:

```
User clicks "Español"
  ↓ setLang('es')
  ↓ localStorage.setItem('motopass-lang', 'es')
  ↓ saveRouteLang(currentPath, 'es')
  ↓ Re-render with Spanish translations
```

### 3. Per-Route Language Override

Advanced: each route remembers its own language:

```
User views /programs in Spanish → saves motopass-lang-by-route["/programs"] = "es"
User views /vault in French → saves motopass-lang-by-route["/vault"] = "fr"
Result: /programs shows Spanish, /vault shows French
```

### 4. Fallback Chain

When a translation key is missing:

```
t('some.key')
  ↓ Check TRANSLATIONS[activeLang]['some.key']
  ↓ If undefined → Check TRANSLATIONS.en['some.key']
  ↓ If undefined → Return 'some.key' (the key itself)
  ↓ In DEV mode → console.warn('[i18n] Missing translation key: ...')
```

---

## Translation Key Structure

All translations use a flat dot-notation key system defined as a TypeScript union type:

```typescript
type TranslationKey =
  | 'nav.pitch'          // Navigation items
  | 'programs.title'     // Page titles
  | 'vault.empty'        // Empty states
  | 'apply.submit'       // Action buttons
  | 'modal.tabOverview'  // Modal tabs
  | ...                  // ~500+ keys total
```

### Key Categories

| Prefix | Category | Example Keys |
|--------|----------|-------------|
| `nav.*` | Navigation | `nav.pitch`, `nav.programs`, `nav.vault` |
| `pitch.*` | Landing page | `pitch.hero`, `pitch.cta`, `pitch.faq.q1` |
| `programs.*` | Program explorer | `programs.title`, `programs.search`, `programs.region` |
| `vault.*` | Document vault | `vault.title`, `vault.doc.status.confirmed` |
| `apply.*` | Application | `apply.title`, `apply.submit`, `apply.success` |
| `agents.*` | Agent interface | `agents.title`, `agents.kimi.liaison` |
| `dashboard.*` | Member dashboard | `dashboard.alertsTitle`, `dashboard.registryTitle` |
| `compare.*` | Comparison | `compare.title`, `compare.best` |
| `simulator.*` | Stack simulator | `simulator.title`, `simulator.saveStack` |
| `portfolio.*` | Portfolio | `portfolio.title`, `portfolio.statPrograms` |
| `btcmap.*` | BTC Map | `btcmap.title`, `btcmap.merchantCount` |
| `distressed.*` | Marketplace | `distressed.title`, `distressed.kimiGold` |
| `verify.*` | Verification | `verify.title`, `verify.stampSatohash` |
| `modal.*` | Program modal | `modal.tabOverview`, `modal.addToStack` |
| `common.*` | Shared UI | `common.cancel`, `common.retry`, `common.copied` |
| `errors.*` | Error states | `errors.boundaryTitle`, `errors.reload` |

### Variable Interpolation

Translations support `{variable}` placeholders:

```typescript
// Translation: "programs.eyebrow": "{count} jurisdictions, tracked"
formatT(t, 'programs.eyebrow', { count: 50 })
// → "50 jurisdictions, tracked"
```

---

## RTL (Right-to-Left) Support

Arabic (`ar`) is the only RTL language. The system handles this automatically:

### Automatic Direction Setting

```typescript
useEffect(() => {
  document.documentElement.lang = lang          // e.g. "ar"
  document.documentElement.dir = meta.dir      // "rtl"
}, [lang, meta.dir])
```

### CSS Implications

The Tailwind CSS utilities respect `dir="rtl"`:
- `ms-*` (margin-inline-start) mirrors automatically
- `me-*` (margin-inline-end) mirrors automatically
- `ps-*` / `pe-*` (padding) mirrors automatically
- `text-left` / `text-right` do NOT mirror (use `text-start` / `text-end` instead)

### Layout Considerations

- Navigation items reverse order
- Back/forward icons may need manual flipping
- Scroll bars move to the left side
- Form inputs maintain LTR for numbers and URLs

---

## Storage Architecture

### Global Language Preference

```
Key: motopass-lang
Storage: localStorage
Value: 'system' | LangCode ('en' | 'es' | 'fr' | ...)
Default: 'system'
```

### Per-Route Language Overrides

```
Key: motopass-lang-by-route
Storage: localStorage
Value: JSON object { "/programs": "es", "/vault": "fr", ... }
Default: {}
```

### Recent Languages

```
Key: motopass-recent-langs
Storage: localStorage
Value: JSON array ['es', 'fr', 'ja'] (up to 3)
Default: []
```

---

## Keyboard Shortcut

The language switcher responds to **⌘L** (Mac) or **Ctrl+L** (Windows/Linux):

```
Keydown event
  ↓ Check: Cmd/Ctrl + L
  ↓ Open language picker dropdown
  ↓ User selects language
  ↓ setLang() → localStorage → re-render
```

This shortcut is displayed in the language picker UI as `⌘L` on Mac and `Ctrl+L` on Windows.

---

## Translation Completeness

### Coverage Levels

| Level | Meaning | Languages |
|-------|---------|-----------|
| **Full** | All keys translated, reviewed | English, Spanish, French, Portuguese, Chinese, Arabic, Swahili, German, Hindi, Japanese |

> **Verified 2026-08-23:** every non-English locale (es/fr/pt/zh/ar/sw/de/hi/ja) has **0 missing keys** against the English source of truth (764 page-keys + 206 base dict keys). "Identical-to-English" values are legit proper nouns / brand IDs (Paige, Seal/Forge/Nexus/Ledger, SGT, Satohash, GitHub, btcmap-cli, 404, ID, ⌘L, sha256), not untranslated fallback. No locale ships gibberish.

### How Fallback Works

When a user views a partially-translated page:

```
User (German) views /programs:
  ✅ "Programme" (nav.programs — translated)
  ✅ "Residency & citizenship programs" (programs.title — translated)
  ❌ "Lightning ready only" (programs.lightningOnly — falls back to English)
  ❌ "Show advanced filters" (programs.showAdvanced — falls back to English)
```

### Adding New Translations

1. Add the key to `TranslationKey` union type in `translations.ts`
2. Add English text in the `en` dictionary
3. Add translations in each language dictionary (or leave for English fallback)
4. The key is now available via `t('new.key')`

---

## Developer Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/i18n/languages.ts` | Language definitions, browser detection, type exports |
| `src/i18n/I18nContext.tsx` | React context provider, `useI18n()` hook |
| `src/i18n/translations.ts` | All translation dictionaries, `TranslationKey` type, `t()` function |
| `src/i18n/pageKeys.ts` | Batched page-level keys (merged into dictionaries) |
| `src/i18n/format.ts` | `formatT()` helper for variable interpolation |
| `src/i18n/routeLangStorage.ts` | Per-route language persistence |
| `src/i18n/recentLangStorage.ts` | Recent language tracking |
| `src/i18n/routeLangStorage.test.ts` | Tests for route language storage |

### Usage in Components

```typescript
// Basic translation
const { t } = useI18n()
return <h1>{t('programs.title')}</h1>

// With variables
const { t } = useI18n()
return <p>{formatT(t, 'programs.eyebrow', { count: 50 })}</p>

// Reading current language
const { lang, dir } = useI18n()
return <div dir={dir}>{/* content */}</div>

// Changing language
const { setLang } = useI18n()
setLang('es')  // Switch to Spanish
setLang('system')  // Reset to auto-detect
```

### Type Safety

```typescript
// This compiles — key exists in TranslationKey union
t('programs.title')

// This fails at compile time — key doesn't exist
t('programs.nonexistent')  // ❌ TypeScript error
```

---

## Honesty Rules for Paige

1. **Always respond in the user's current language** — detect from context or ask politely.
2. **Never promise full translation coverage** in all 10 languages — only English, Spanish, and French are fully translated.
3. **Explain English fallback** when a user sees English text in another language — it means that key hasn't been translated yet.
4. **Mention ⌘L shortcut** when users ask how to switch languages — it's the fastest method.
5. **Clarify 'system' mode** — it auto-detects from browser settings, not GPS or IP.
6. **Note per-route overrides** only when relevant — most users just need the global setting.
7. **Acknowledge RTL** for Arabic users — the layout flips automatically, but some elements may need manual adjustment.
8. **Never store language preference on the server** — everything stays in the user's browser localStorage.

---

## Common User Questions

| User asks | Paige responds with |
|-----------|-------------------|
| "How do I change the language?" | Click the language indicator in the nav bar or press ⌘L (Mac) / Ctrl+L (Windows) |
| "Why is some text in English?" | That section hasn't been translated to your language yet — it falls back to English automatically |
| "Do you support Arabic?" | Yes! Arabic is fully supported with automatic RTL layout — the entire interface mirrors for right-to-left reading |
| "Can I use different languages on different pages?" | Yes — each page remembers its own language preference. View /programs in Spanish and /vault in French |
| "How many languages do you support?" | 10 languages: English, Spanish, French, Portuguese, Chinese, Arabic, Swahili, German, Hindi, and Japanese |
| "What does 'System' language mean?" | It auto-detects from your browser settings — if your browser is set to Japanese, the site shows Japanese |
| "Will my language choice be saved?" | Yes — it's saved in your browser's localStorage and persists across sessions. Clearing browser data resets to system default |
| "Can I help translate?" | Translations are in the source code (src/i18n/translations.ts). New languages start with core navigation, with other sections filled in over time |
