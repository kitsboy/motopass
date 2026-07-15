import { getProgramCoord } from '../../data/programCoords'
import type { BtcMapArea, BtcMapPlace } from '../../lib/btcmap'
import { BtcMapLeaflet } from './BtcMapLeaflet'

export function BtcMapEmbed({
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
  if (!coord && !areas.length && !places.length) return null

  return <BtcMapLeaflet programName={programName} places={places} areas={areas} tall={tall} />
}