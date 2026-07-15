import { ExternalLink, Plus, Terminal } from 'lucide-react'
import { btcMapAddVenueUrl, btcMapCliRepoUrl } from '../../lib/btcmap'
import { useI18n } from '../../i18n/I18nContext'

export function BtcMapReportVenue({
  lat,
  lon,
  variant = 'card',
}: {
  lat?: number
  lon?: number
  variant?: 'card' | 'inline'
}) {
  const { t } = useI18n()

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted font-chrome">
        <span className="text-ink-muted/80">{t('btcmap.reportTitle')}:</span>
        <a
          href={btcMapAddVenueUrl(lat, lon)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-mp-btc-text hover:underline underline-offset-2"
        >
          <Plus size={11} aria-hidden /> {t('btcmap.reportWeb')}
        </a>
        <span className="text-ink-muted/40">·</span>
        <a
          href={btcMapCliRepoUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-ink transition-colors"
        >
          <Terminal size={11} aria-hidden /> {t('btcmap.reportCli')}
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-mp-md border border-dashed border-btc-orange/35 bg-btc-orange-soft/25 p-4 space-y-3">
      <div>
        <h3 className="font-display font-semibold text-sm text-ink">{t('btcmap.reportTitle')}</h3>
        <p className="text-xs text-ink-secondary mt-1 leading-relaxed">{t('btcmap.reportSub')}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={btcMapAddVenueUrl(lat, lon)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm inline-flex items-center justify-center gap-2 flex-1"
        >
          {t('btcmap.reportWeb')} <ExternalLink size={14} />
        </a>
        <a
          href={btcMapCliRepoUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm inline-flex items-center justify-center gap-2 flex-1"
        >
          <Terminal size={14} /> {t('btcmap.reportCli')}
        </a>
      </div>
      <p className="text-[10px] text-ink-muted font-mono leading-relaxed">
        {t('btcmap.reportCliHint')}
      </p>
    </div>
  )
}