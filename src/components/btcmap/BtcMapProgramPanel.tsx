import { Link } from 'react-router-dom'
import { ExternalLink, Map } from 'lucide-react'
import { useBtcMapPlaces } from '../../hooks/useBtcMapPlaces'
import { btcMapPageUrl } from '../../lib/btcmap'
import { BtcMapPlacesList } from './BtcMapPlacesList'
import { BtcMapAreasChips } from './BtcMapAreasChips'
import { useI18n } from '../../i18n/I18nContext'
import { formatT } from '../../i18n/format'

export function BtcMapProgramPanel({ programName, programId }: { programName: string; programId: string }) {
  const { t } = useI18n()
  const { places, areas, loading, error } = useBtcMapPlaces(programName)

  return (
    <div id="btcmap-program-panel" className="mt-4 rounded-mp-md border border-mp-border bg-mp-card-muted/40 p-4 scroll-mt-24">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display font-semibold text-sm text-ink flex items-center gap-2">
            <Map size={14} className="text-btc-orange" /> {t('btcmap.panelTitle')}
          </h3>
          <p className="text-[11px] text-ink-muted mt-0.5">{t('btcmap.panelSub')}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Link
            to={btcMapPageUrl(programId, 'directory')}
            className="chip text-[10px] text-accent hover:underline inline-flex items-center gap-1"
          >
            {t('btcmap.explore')} <ExternalLink size={10} aria-hidden />
          </Link>
          <Link
            to={`/programs?q=${encodeURIComponent(programName)}`}
            className="chip text-[10px] text-mp-btc-text hover:underline inline-flex items-center gap-1"
          >
            {t('btcmap.openInPrograms')} →
          </Link>
        </div>
      </div>
      <BtcMapAreasChips areas={areas} />
      <div className="mt-3 mb-2 text-[10px] font-mono uppercase tracking-wide text-ink-muted">
        {loading ? t('btcmap.loading') : formatT(t, 'btcmap.merchantCount', { count: places.length })}
      </div>
      <BtcMapPlacesList places={places.slice(0, 6)} loading={loading} error={error} compact />
    </div>
  )
}