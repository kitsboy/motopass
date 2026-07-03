import { LANGUAGES } from '../i18n/languages'
import { useI18n } from '../i18n/I18nContext'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n()

  return (
    <div className={`flex ${compact ? 'gap-1' : 'gap-1.5'} flex-wrap items-center`} role="group" aria-label="Language">
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          title={`${l.name} (${l.nativeName})`}
          className={`${compact ? 'text-base px-1.5 py-1' : 'text-lg px-2 py-1'} rounded-mp-md border transition-all ${
            lang === l.code
              ? 'border-btc-orange bg-btc-orange-soft scale-105 shadow-sm'
              : 'border-mp bg-card hover:border-mp-strong opacity-90 hover:opacity-100'
          }`}
          aria-pressed={lang === l.code}
        >
          {l.flag}
          {!compact && <span className="sr-only">{l.name}</span>}
        </button>
      ))}
    </div>
  )
}