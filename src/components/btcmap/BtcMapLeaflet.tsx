import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getProgramCoord } from '../../data/programCoords'
import { btcMapMerchantUrl } from '../../lib/btcmap'
import { gridClusterPlaces } from '../../lib/btcmapCluster'
import type { BtcMapArea, BtcMapPlace } from '../../lib/btcmap'
import { useI18n } from '../../i18n/I18nContext'
import { BtcMapPinPopover } from './BtcMapPinPopover'

const pinIcon = L.divIcon({
  className: '',
  html: '<span class="btcmap-pin"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function clusterIcon(count: number) {
  const size = count > 99 ? 36 : count > 9 ? 32 : 28
  return L.divIcon({
    className: '',
    html: `<span class="btcmap-cluster" style="width:${size}px;height:${size}px;line-height:${size}px">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function MapZoomTracker({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useMapEvents({
    zoomend: () => {
      const z = map.getZoom()
      setZoom(z)
      onZoom(z)
    },
  })

  useEffect(() => {
    onZoom(zoom)
  }, [zoom, onZoom])

  return null
}

function PlaceMarkers({ places, zoom }: { places: BtcMapPlace[]; zoom: number }) {
  const { t } = useI18n()
  const clusters = useMemo(() => gridClusterPlaces(places, zoom), [places, zoom])

  if (clusters) {
    return (
      <>
        {clusters.map(c => (
          <Marker key={c.key} position={[c.lat, c.lon]} icon={clusterIcon(c.count)}>
            <Popup>
              <div className="text-sm font-medium">{c.count} merchants</div>
              <ul className="text-xs text-gray-600 mt-1 max-h-32 overflow-y-auto space-y-0.5">
                {c.places.slice(0, 6).map(p => (
                  <li key={p.id} className="truncate">{p.name ?? t('btcmap.unnamed')}</li>
                ))}
                {c.places.length > 6 && <li className="text-gray-400">+{c.places.length - 6} more</li>}
              </ul>
            </Popup>
          </Marker>
        ))}
      </>
    )
  }

  return (
    <>
      {places.map(p => (
        <Marker key={p.id} position={[p.lat, p.lon]} icon={pinIcon}>
          <Popup>
            <BtcMapPinPopover
              name={p.name ?? t('btcmap.unnamed')}
              address={p.address}
              merchantUrl={btcMapMerchantUrl(p.id)}
            />
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export function BtcMapLeaflet({
  programName,
  places,
  areas,
  tall = false,
}: {
  programName: string
  places: BtcMapPlace[]
  areas: BtcMapArea[]
  tall?: boolean
}) {
  const coord = getProgramCoord(programName)
  const [zoom, setZoom] = useState<number | null>(null)

  const center = useMemo(() => {
    if (coord) return [coord.lat, coord.lon] as [number, number]
    const first = places[0]
    if (first) return [first.lat, first.lon] as [number, number]
    return [20, 0] as [number, number]
  }, [coord, places])

  const initialZoom = useMemo(() => {
    if (!coord) return 4
    if (coord.radiusKm <= 20) return 11
    if (coord.radiusKm <= 40) return 10
    return 9
  }, [coord])

  if (!coord && !places.length && !areas.length) return null

  return (
    <div className="rounded-card border border-mp-border overflow-hidden bg-mp-card shadow-mp-1 btcmap-leaflet-wrap">
      <MapContainer
        center={center}
        zoom={initialZoom}
        scrollWheelZoom={false}
        className="w-full"
        style={{
          height: tall ? 'min(520px, 62vh)' : 'min(420px, 55vh)',
          minHeight: tall ? 360 : 280,
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapZoomTracker onZoom={setZoom} />
        {coord && (
          <Circle
            center={[coord.lat, coord.lon]}
            radius={coord.radiusKm * 1000}
            pathOptions={{ color: '#f7931a', fillColor: '#f7931a', fillOpacity: 0.08, weight: 1.5 }}
          />
        )}
        {zoom != null && <PlaceMarkers places={places} zoom={zoom} />}
      </MapContainer>
    </div>
  )
}