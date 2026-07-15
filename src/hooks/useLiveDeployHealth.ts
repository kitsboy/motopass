import { useEffect, useState } from 'react'
import { BUILD_ID } from '../lib/buildInfo'
import { LIVE_ORIGIN, parseLiveIndexHtml, saltToBuildId } from '../lib/liveDeploy'

export type LiveDeployHealth = 'unknown' | 'synced' | 'stale'

/** Compare local BUILD_ID to live index.html on mount; fails silently. */
export function useLiveDeployHealth(): LiveDeployHealth {
  const [health, setHealth] = useState<LiveDeployHealth>('unknown')

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    void (async () => {
      try {
        const res = await fetch(`${LIVE_ORIGIN}/`, {
          cache: 'no-store',
          signal: controller.signal,
          headers: { Accept: 'text/html' },
        })
        if (!res.ok) return
        const html = await res.text()
        const { buildSalt } = parseLiveIndexHtml(html)
        if (!buildSalt || cancelled) return
        const liveId = saltToBuildId(buildSalt) ?? buildSalt
        if (!cancelled) setHealth(liveId === BUILD_ID ? 'synced' : 'stale')
      } catch {
        /* graceful fail — keep unknown */
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return health
}