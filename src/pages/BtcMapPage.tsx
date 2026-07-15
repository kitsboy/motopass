import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bitcoin, ExternalLink, Zap } from 'lucide-react'
import { usePrograms } from '../hooks/usePrograms'
import { useBtcMapPlaces } from '../hooks/useBtcMapPlaces'
import { useBtcMapAuth } from '../context/BtcMapAuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { BtcMapEmbed } from '../components/btcmap/BtcMapEmbed'
import { BtcMapMerchantDirectory } from '../components/btcmap/BtcMapMerchantDirectory'
import { BtcMapAreasChips } from '../components/btcmap/BtcMapAreasChips'
import { BtcMapReportVenue } from '../components/btcmap/BtcMapReportVenue'
import { NostrConnect } from '../components/NostrConnect'
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
      const match = programs.find(p => p.name.toLowerCase().includes(q.toLowerCase()))
      if (match) return match.id
    }
    return programs[0]?.id ?? null
  }, [searchParams, programs])

  const selected = programs.find(p => p.id === programId) ?? null
  const { places, areas, loading, error, fromCache } = useBtcMapPlaces(selected?.name ?? null)
  const { signIn, signingIn } = useBtcMapAuth()
  const coord = selected ? getProgramCoord(selected.name) : null
  const attr = btcMapAttribution()

  const setProgram = (id: number) => {
    setSearchParams(p => {
      p.set('program', serializeIdList([id]))
      p.delete('q')
      return p
    }, { replace: true })
  }

  const withCoords = useMemo(
    () => programs.filter(p => getProgramCoord(p.name)),
    [programs],
  )

  return (
    <div className="page-container px-4 sm:px-6 py-8 max-w-7xl mx-auto">
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
            <Bitcoin size={12} aria-hidden /> btcmap.org <ExternalLink size={10} />
          </a>
        }
      />

      <p className="text-sm text-ink-secondary mb-6 max-w-3xl leading-relaxed">
        {t('btcmap.intro')}
      </p>

      {/* Command bar */}
      <Card variant="elevated" animate className="mb-6 !p-4 sm:!p-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
          <div className="flex-1 min-w-[12rem] max-w-md">
            <label htmlFor="btcmap-program" className="section-label block mb-1.5">
              {t('btcmap.selectProgram')}
            </label>
            <select
              id="btcmap-program"
              value={programId ?? ''}
              onChange={e => setProgram(Number(e.target.value))}
              disabled={programsLoading}
              className="select-field w-full"
            >
              {withCoords.map(p => (
                <option key={p.id} value={p.id}>{p.flag} {p.name}</option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="flex-1 min-w-0 lg:border-l lg:border-mp/50 lg:pl-6">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-display font-semibold text-ink">{selected.flag} {selected.name}</span>
                {selected.lightning_ready && (
                  <span className="proof-badge text-[10px]">{t('btcmap.lightningReady')}</span>
                )}
                {fromCache && (
                  <span className="text-[10px] font-mono text-ink-muted border border-mp/60 rounded-chip px-2 py-0.5">
                    {t('btcmap.offlineCache')}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">{selected.bitcoin_integration}</p>
              <Link
                to={`/programs?q=${encodeURIComponent(selected.name)}`}
                className="text-[11px] font-chrome text-mp-btc-text hover:underline underline-offset-2 mt-1 inline-block"
              >
                {t('btcmap.viewProgram')} →
              </Link>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            <NostrConnect onConnect={s => { if (s) void signIn() }} />
            <button
              type="button"
              onClick={() => void signIn()}
              disabled={signingIn}
              className="chip text-[11px] text-ink-muted hover:text-ink"
            >
              {signingIn ? t('btcmap.signingIn') : t('btcmap.signInSave')}
            </button>
            {!loading && selected && (
              <span className="text-[10px] font-mono text-ink-muted tabular-nums">
                {formatT(t, 'btcmap.merchantCount', { count: places.length })}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Map + directory split */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 xl:gap-6 items-stretch">
        <div className="xl:col-span-3 flex flex-col gap-3 min-h-0">
          {selected ? (
            <BtcMapEmbed programName={selected.name} places={places} areas={areas} tall />
          ) : (
            <Card className="flex items-center justify-center py-24 text-ink-muted text-sm">
              {t('btcmap.pickProgram')}
            </Card>
          )}

          {areas.length > 0 && (
            <div className="px-1">
              <BtcMapAreasChips areas={areas} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 pt-1">
            {coord && (
              <a
                href={btcMapMapUrl(coord.lat, coord.lon)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-chrome text-mp-btc-text inline-flex items-center gap-1.5 hover:underline underline-offset-2"
              >
                {t('btcmap.openFullMap')} <ExternalLink size={12} />
              </a>
            )}
            <BtcMapReportVenue lat={coord?.lat} lon={coord?.lon} variant="inline" />
          </div>

          <p className="text-[10px] text-ink-muted leading-relaxed px-1">
            {t('btcmap.attribution')}{' '}
            <a href={attr.map} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">BTC Map</a>
            {' · '}
            <a href={attr.api} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">API</a>
            {' · '}{attr.data}
          </p>
        </div>

        <Card
          variant="elevated"
          className="xl:col-span-2 flex flex-col min-h-[min(420px,50vh)] xl:min-h-[min(560px,70vh)] max-h-[min(560px,70vh)] overflow-hidden !p-0"
        >
          <BtcMapMerchantDirectory
            places={places}
            loading={loading}
            error={error}
            showSave
          />
          <div className="shrink-0 px-4 py-3 border-t border-mp/50 bg-card-muted/30 flex items-center gap-2 text-[10px] text-ink-muted font-mono">
            <Zap size={10} className="text-btc-orange shrink-0" aria-hidden />
            <span className="truncate">api.btcmap.org · community-sourced</span>
          </div>
        </Card>
      </div>
    </div>
  )
}