import { useMemo } from 'react'
import { getProgramCoord } from '../../data/programCoords'
import { btcMapCountryUrl, btcMapMapUrl } from '../../lib/btcmap'
import type { BtcMapArea } from '../../lib/btcmap'

export function BtcMapEmbed({
  programName,
  areas,
}: {
  programName: string
  areas: BtcMapArea[]
}) {
  const coord = getProgramCoord(programName)
  const src = useMemo(() => {
    const country = areas.find((a) => a.type === 'country')
    if (country?.url_alias) return btcMapCountryUrl(country.url_alias)
    if (coord) return btcMapMapUrl(coord.lat, coord.lon, 10)
    return 'https://btcmap.org/map'
  }, [areas, coord])

  if (!coord && !areas.length) return null

  return (
    <div className="rounded-card border border-mp-border overflow-hidden bg-mp-card shadow-mp-1">
      <iframe
        title={`BTC Map — ${programName}`}
        src={src}
        className="w-full border-0 bg-canvas"
        style={{ height: 'min(420px, 55vh)' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}