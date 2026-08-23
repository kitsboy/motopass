import { Film } from 'lucide-react'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n/I18nContext'
import { VaultEducationPlayer } from './VaultEducationPlayer'

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
          <Film size={36} className="relative text-fuchsia/80" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-chrome text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t('vault.educationEyebrow')}
          </p>
          <h3 className="font-display text-sm font-semibold text-ink mt-1">
            {t('vault.educationTitle')}
          </h3>
          <p className="font-body text-xs text-ink-muted mt-2 leading-relaxed">
            {t('vault.educationBody')}
          </p>
          {/* Watch walkthrough — real player (lazy-loaded, on-brand, mobile-first) */}
          <VaultEducationPlayer />
        </div>
      </div>
    </Card>
  )
}
