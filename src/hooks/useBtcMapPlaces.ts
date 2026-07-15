import { useEffect, useState } from 'react'
import { getAreasAt, searchPlacesNearby, type BtcMapArea, type BtcMapPlace } from '../lib/btcmap'
import { loadBtcMapSnapshot } from '../lib/btcmapCache'
import { getProgramCoord, type ProgramCoord } from '../data/programCoords'

type State = {
  places: BtcMapPlace[]
  areas: BtcMapArea[]
  loading: boolean
  error: string | null
  fromCache: boolean
  fetchedAt: string | null
}

const IDLE: State = { places: [], areas: [], loading: false, error: null, fromCache: false, fetchedAt: null }
const LOADING: State = { places: [], areas: [], loading: true, error: null, fromCache: false, fetchedAt: null }

function useBtcMapFetch(programName: string | null, coord: ProgramCoord | null): State {
  const [state, setState] = useState<State>(IDLE)

  useEffect(() => {
    if (!programName || !coord) return

    let cancelled = false

    const run = async () => {
      const snapshot = await loadBtcMapSnapshot(programName)
      if (cancelled) return

      if (snapshot) {
        setState({
          places: snapshot.places,
          areas: snapshot.areas,
          loading: false,
          error: null,
          fromCache: true,
          fetchedAt: snapshot.fetchedAt,
        })
      } else {
        setState(LOADING)
      }

      try {
        const [places, areas] = await Promise.all([
          searchPlacesNearby({ lat: coord.lat, lon: coord.lon, radiusKm: coord.radiusKm }),
          getAreasAt(coord.lat, coord.lon),
        ])
        if (cancelled) return
        setState({ places, areas, loading: false, error: null, fromCache: false, fetchedAt: null })
      } catch (err: unknown) {
        if (cancelled) return
        if (snapshot) return
        setState({
          places: [],
          areas: [],
          loading: false,
          error: err instanceof Error ? err.message : 'fetch_failed',
          fromCache: false,
          fetchedAt: null,
        })
      }
    }

    void run()
    return () => { cancelled = true }
  }, [programName, coord])

  return state
}

export function useBtcMapPlaces(programName: string | null): State {
  const coord = programName ? getProgramCoord(programName) : null
  const fetched = useBtcMapFetch(programName, coord)

  if (!programName) return IDLE
  if (!coord) return { places: [], areas: [], loading: false, error: 'no_coords', fromCache: false, fetchedAt: null }
  return fetched
}