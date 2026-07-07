import { useEffect, useState } from 'react'
import { getAreasAt, searchPlacesNearby, type BtcMapArea, type BtcMapPlace } from '../lib/btcmap'
import { getProgramCoord, type ProgramCoord } from '../data/programCoords'

type State = {
  places: BtcMapPlace[]
  areas: BtcMapArea[]
  loading: boolean
  error: string | null
}

const IDLE: State = { places: [], areas: [], loading: false, error: null }
const LOADING: State = { places: [], areas: [], loading: true, error: null }

function useBtcMapFetch(programName: string | null, coord: ProgramCoord | null): State {
  const [state, setState] = useState<State>(IDLE)

  useEffect(() => {
    if (!programName || !coord) return

    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) setState(LOADING)
    })

    Promise.all([
      searchPlacesNearby({ lat: coord.lat, lon: coord.lon, radiusKm: coord.radiusKm }),
      getAreasAt(coord.lat, coord.lon),
    ])
      .then(([places, areas]) => {
        if (cancelled) return
        setState({ places, areas, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({
          places: [],
          areas: [],
          loading: false,
          error: err instanceof Error ? err.message : 'fetch_failed',
        })
      })

    return () => { cancelled = true }
  }, [programName, coord?.lat, coord?.lon, coord?.radiusKm])

  return state
}

export function useBtcMapPlaces(programName: string | null): State {
  const coord = programName ? getProgramCoord(programName) : null
  const fetched = useBtcMapFetch(programName, coord)

  if (!programName) return IDLE
  if (!coord) return { places: [], areas: [], loading: false, error: 'no_coords' }
  return fetched
}