import { LANGUAGES, type LangCode } from '../i18n/languages'
import { useI18n } from '../i18n/I18nContext'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n()

  if (!compact) {
    return (
      <label className="flex items-center gap-2 text-xs text-ink-muted">
        <span className="sr-only">Language</span>
        <select
          value={lang}
          onChange={e => setLang(e.target.value as LangCode)}
          aria-label="Language"
          className="select-field min-h-[44px] py-2 text-sm"
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.nativeName}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <div className="flex gap-1 flex-wrap items-center" role="group" aria-label="Language">
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          title={`${l.name} (${l.nativeName})`}
          className={`text-base px-1.5 py-1 rounded-mp-md border transition-all ${
            lang === l.code
              ? 'border-btc-orange bg-btc-orange-soft scale-105 shadow-sm'
              : 'border-mp bg-card hover:border-mp-strong opacity-90 hover:opacity-100'
          }`}
          aria-pressed={lang === l.code}
        >
          {l.flag}
          <span className="sr-only">{l.name}</span>
        </button>
      ))}
    </div>
  )
}