import { useI18n } from '../../i18n/I18nContext'
import { useProgramsContext } from '../../context/ProgramsContext'

/** Shown when countries.json fails to load */
export function ProgramsLoadError({ message }: { message: string }) {
  const { t } = useI18n()
  const { refresh } = useProgramsContext()

  return (
    <div
      className="rounded-mp-lg border border-status-red/30 bg-status-red/5 px-4 py-3 text-sm text-ink-secondary"
      role="alert"
    >
      <p className="font-medium text-status-red">{t('errors.programsLoadTitle')}</p>
      <p className="mt-1 text-ink-muted">{message}</p>
      <button
        type="button"
        onClick={refresh}
        className="mt-3 text-sm font-medium text-accent hover:underline"
      >
        {t('common.retry')}
      </button>
    </div>
  )
}