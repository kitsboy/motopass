import { PlayCircle } from 'lucide-react'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n/I18nContext'
import { BUILD_ID } from '../../lib/buildInfo'

export function VaultEducationCard() {
  const { t } = useI18n()

  return (
    <Card variant="muted" animate className="mb-8 overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4">
        <div
          className="relative flex h-28 sm:h-auto sm:w-40 shrink-0 items-center justify-center rounded-mp-md border border-mp/60 bg-gradient-to-br from-card-muted/80 via-section/60 to-btc-orange-soft/30"
          aria-hidden
        >
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(255,149,0,0.35),transparent_55%)]" />
          <PlayCircle size={36} className="relative text-btc-orange/70" strokeWidth={1.5} />
          <span className="absolute bottom-2 right-2 rounded-chip border border-mp/50 bg-card/80 px-1.5 py-0.5 text-[9px] font-mono text-ink-muted">
            {BUILD_ID}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-chrome text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t('vault.educationEyebrow')}
          </p>
          <h3 className="font-display text-sm font-semibold text-ink mt-1">{t('vault.educationTitle')}</h3>
          <p className="font-body text-xs text-ink-muted mt-2 leading-relaxed">{t('vault.educationBody')}</p>
          <button
            type="button"
            disabled
            className="mt-3 btn-secondary text-xs !py-1.5 !px-3 opacity-60 cursor-not-allowed inline-flex items-center gap-1.5"
            aria-disabled="true"
            title={t('vault.educationStubHint')}
          >
            <PlayCircle size={12} aria-hidden />
            {t('vault.educationStub')}
          </button>
        </div>
      </div>
    </Card>
  )
}