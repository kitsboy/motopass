import { useCallback, useEffect, useState } from 'react'
import { FALLBACK_LAUNCH_GATES, fetchLaunchGates, type LaunchGateReport } from '../lib/launch/launchGates'

const DEFAULT_REFRESH_MS = 5 * 60 * 1000

export function useLaunchGates(options?: { refreshMs?: number | false }) {
  const [report, setReport] = useState<LaunchGateReport>(FALLBACK_LAUNCH_GATES)
  const [loading, setLoading] = useState(true)
  const refreshMs = options?.refreshMs === false ? false : (options?.refreshMs ?? false)

  const refresh = useCallback(async () => {
    const data = await fetchLaunchGates()
    setReport(data)
    setLoading(false)
    return data
  }, [])

  useEffect(() => {
    let cancelled = false
    void refresh().then(() => {
      if (cancelled) return
    })
    return () => { cancelled = true }
  }, [refresh])

  useEffect(() => {
    if (!refreshMs) return
    const timer = window.setInterval(() => void refresh(), refreshMs)
    return () => window.clearInterval(timer)
  }, [refresh, refreshMs])

  return {
    report,
    loading,
    refresh,
    applicationsOpen: report.applications_open,
    agentsMessagingOpen: report.agents_messaging_open ?? false,
  }
}

export { DEFAULT_REFRESH_MS as LAUNCH_GATES_REFRESH_MS }