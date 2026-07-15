import { useEffect, useState } from 'react'
import { BUILD_ID } from '../lib/buildInfo'
import { LIVE_ORIGIN, parseLiveIndexHtml, saltToBuildId } from '../lib/liveDeploy'

export type LiveDeployHealth = 'unknown' | 'synced' | 'stale'

export type LiveDeployHealthState = {
  status: LiveDeployHealth
  liveBuildId: string | null
}

const INITIAL: LiveDeployHealthState = { status: 'unknown', liveBuildId: null }

/** Compare local BUILD_ID to live index.html on mount; fails silently. */
export function useLiveDeployHealth(): LiveDeployHealthState {
  const [health, setHealth] = useState<LiveDeployHealthState>(INITIAL)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.pages.dev')) return
    }

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
        if (!cancelled) {
          setHealth({
            status: liveId === BUILD_ID ? 'synced' : 'stale',
            liveBuildId: liveId,
          })
        }
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