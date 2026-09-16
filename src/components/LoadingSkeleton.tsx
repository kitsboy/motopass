import { useI18n } from '../i18n/I18nContext'

export function CardSkeleton({ count = 3 }: { count?: number }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="status" aria-busy="true" aria-label={t('layout.loadingAria')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card space-y-3 animate-rise-in" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="skeleton-shimmer h-5 w-2/3" />
          <div className="skeleton-shimmer h-3 w-1/2" />
          <div className="skeleton-shimmer h-14 w-full" />
          <div className="skeleton-shimmer h-8 w-1/3" />
        </div>
      ))}
    </div>
  )
}

export function RowSkeleton({ count = 4 }: { count?: number }) {
  const { t } = useI18n()
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label={t('layout.loadingAria')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card flex gap-4 items-center animate-rise-in" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="skeleton-shimmer h-10 w-10 rounded-mp-md shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="skeleton-shimmer h-4 w-1/3" />
            <div className="skeleton-shimmer h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}