import { useEffect, useState } from 'react'
import { FALLBACK_LAUNCH_GATES, fetchLaunchGates, type LaunchGateReport } from '../lib/launch/launchGates'

export function useLaunchGates() {
  const [report, setReport] = useState<LaunchGateReport>(FALLBACK_LAUNCH_GATES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetchLaunchGates().then(data => {
      if (!cancelled) {
        setReport(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  return {
    report,
    loading,
    applicationsOpen: report.applications_open,
    agentsMessagingOpen: report.agents_messaging_open ?? false,
  }
}