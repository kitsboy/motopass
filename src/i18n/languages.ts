export type LangCode = 'en' | 'es' | 'fr' | 'pt' | 'zh' | 'ar' | 'sw' | 'de' | 'hi'

export interface Language {
  code: LangCode
  flag: string
  name: string
  nativeName: string
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: Language[] = [
  { code: 'en', flag: '🇬🇧', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', flag: '🇪🇸', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', flag: '🇫🇷', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'pt', flag: '🇵🇹', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'zh', flag: '🇨🇳', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'sw', flag: '🇰🇪', name: 'Swahili', nativeName: 'Kiswahili', dir: 'ltr' },
  { code: 'de', flag: '🇩🇪', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'hi', flag: '🇮🇳', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
]

export const DEFAULT_LANG: LangCode = 'en'