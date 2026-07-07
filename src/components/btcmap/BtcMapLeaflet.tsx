import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getProgramCoord } from '../../data/programCoords'
import { btcMapMerchantUrl } from '../../lib/btcmap'
import type { BtcMapArea, BtcMapPlace } from '../../lib/btcmap'
import { useI18n } from '../../i18n/I18nContext'

const pinIcon = L.divIcon({
  className: '',
  html: '<span class="btcmap-pin"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export function BtcMapLeaflet({
  programName,
  places,
  areas,
}: {
  programName: string
  places: BtcMapPlace[]
  areas: BtcMapArea[]
}) {
  const { t } = useI18n()
  const coord = getProgramCoord(programName)

  const center = useMemo(() => {
    if (coord) return [coord.lat, coord.lon] as [number, number]
    const first = places[0]
    if (first) return [first.lat, first.lon] as [number, number]
    return [20, 0] as [number, number]
  }, [coord, places])

  const zoom = useMemo(() => {
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
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full"
        style={{ height: 'min(420px, 55vh)', minHeight: 280 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coord && (
          <Circle
            center={[coord.lat, coord.lon]}
            radius={coord.radiusKm * 1000}
            pathOptions={{ color: '#f7931a', fillColor: '#f7931a', fillOpacity: 0.08, weight: 1.5 }}
          />
        )}
        {places.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lon]} icon={pinIcon}>
            <Popup>
              <div className="text-sm font-medium">{p.name ?? t('btcmap.unnamed')}</div>
              {p.address && <div className="text-xs text-gray-600 mt-0.5">{p.address}</div>}
              <a
                href={btcMapMerchantUrl(p.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-600 hover:underline mt-1 inline-block"
              >
                btcmap.org →
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}