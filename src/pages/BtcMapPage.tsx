import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bitcoin, ExternalLink, Map } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { useBtcMapPlaces } from '../hooks/useBtcMapPlaces'
import { PageHeader } from '../components/ui/PageHeader'
import { BtcMapEmbed } from '../components/btcmap/BtcMapEmbed'
import { BtcMapPlacesList } from '../components/btcmap/BtcMapPlacesList'
import { BtcMapAreasChips } from '../components/btcmap/BtcMapAreasChips'
import { useI18n } from '../i18n/I18nContext'
import { formatT } from '../i18n/format'
import { btcMapAttribution, btcMapMapUrl } from '../lib/btcmap'
import { getProgramCoord } from '../data/programCoords'
import { serializeIdList, parseIdList } from '../lib/urlState'

export function BtcMapPage() {
  const { t } = useI18n()
  const { programs, loading: programsLoading } = usePrograms()
  const [searchParams, setSearchParams] = useSearchParams()

  const programId = useMemo(() => {
    const ids = parseIdList(searchParams.get('program'))
    if (ids[0]) return ids[0]
    const q = searchParams.get('q')?.trim()
    if (q) {
      const match = programs.find((p) => p.name.toLowerCase().includes(q.toLowerCase()))
      if (match) return match.id
    }
    return programs[0]?.id ?? null
  }, [searchParams, programs])

  const selected = programs.find((p) => p.id === programId) ?? null
  const { places, areas, loading, error } = useBtcMapPlaces(selected?.name ?? null)
  const coord = selected ? getProgramCoord(selected.name) : null
  const attr = btcMapAttribution()

  const setProgram = (id: number) => {
    setSearchParams((p) => {
      p.set('program', serializeIdList([id]))
      p.delete('q')
      return p
    }, { replace: true })
  }

  const withCoords = useMemo(
    () => programs.filter((p) => getProgramCoord(p.name)),
    [programs],
  )

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow={t('btcmap.eyebrow')}
        title={t('btcmap.title')}
        subtitle={t('btcmap.subtitle')}
        actions={
          <a
            href="https://btcmap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="chip text-xs inline-flex items-center gap-1.5 text-accent"
          >
            <Bitcoin size={12} /> btcmap.org <ExternalLink size={10} />
          </a>
        }
      />

      <p className="text-sm text-ink-secondary mb-6 max-w-3xl leading-relaxed">
        {t('btcmap.intro')}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <label htmlFor="btcmap-program" className="text-xs font-medium text-ink-muted block">
            {t('btcmap.selectProgram')}
          </label>
          <select
            id="btcmap-program"
            value={programId ?? ''}
            onChange={(e) => setProgram(Number(e.target.value))}
            disabled={programsLoading}
            className="select-field w-full"
          >
            {withCoords.map((p) => (
              <option key={p.id} value={p.id}>{p.flag} {p.name}</option>
            ))}
          </select>

          {selected && (
            <div className="card-muted text-xs space-y-2">
              <div className="font-display font-semibold text-ink">{selected.flag} {selected.name}</div>
              <p className="text-ink-secondary leading-relaxed">{selected.bitcoin_integration}</p>
              {selected.lightning_ready && (
                <span className="proof-badge text-[10px]">{t('btcmap.lightningReady')}</span>
              )}
              <Link
                to={`/programs?q=${encodeURIComponent(selected.name)}`}
                className="text-accent hover:underline inline-flex items-center gap-1"
              >
                {t('btcmap.viewProgram')} →
              </Link>
            </div>
          )}

          <div>
            <h2 className="font-display font-semibold text-sm text-ink mb-2 flex items-center gap-2">
              <Map size={14} className="text-btc-orange" />
              {formatT(t, 'btcmap.merchantCount', { count: places.length })}
            </h2>
            <BtcMapAreasChips areas={areas} />
          </div>

          <BtcMapPlacesList places={places} loading={loading} error={error} />

          {coord && (
            <a
              href={btcMapMapUrl(coord.lat, coord.lon)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full text-center text-sm inline-flex items-center justify-center gap-2"
            >
              {t('btcmap.openFullMap')} <ExternalLink size={14} />
            </a>
          )}
        </div>

        <div className="lg:col-span-2 space-y-3">
          {selected ? (
            <BtcMapEmbed programName={selected.name} areas={areas} />
          ) : (
            <div className="rounded-card border border-mp-border bg-mp-card-muted p-12 text-center text-ink-muted">
              {t('btcmap.pickProgram')}
            </div>
          )}
          <p className="text-[10px] text-ink-muted leading-relaxed">
            {t('btcmap.attribution')}{' '}
            <a href={attr.map} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">BTC Map</a>
            {' · '}
            <a href={attr.api} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">API</a>
            {' · '}{attr.data}
          </p>
        </div>
      </div>
    </div>
  )
}