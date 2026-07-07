import { useI18n } from '../i18n/I18nContext'

export function ErrorFallback() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="card-elevated max-w-md w-full text-center py-12">
        <h2 className="text-xl font-display font-semibold text-status-red mb-2">{t('errors.boundaryTitle')}</h2>
        <p className="text-sm text-ink-secondary mb-6">{t('errors.boundaryBody')}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-primary">
          {t('errors.reload')}
        </button>
      </div>
    </div>
  )
}