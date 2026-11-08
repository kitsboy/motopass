/**
 * Weekly source-probe date from watch.last_probe_at.
 * Not a research re-check — lastChecked stays on FreshnessBadge.
 */
const PROBE_MONTH = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' })

function sourcesProbedLabel(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const month = PROBE_MONTH.format(d).replace(/[,.]/g, '').trim()
  if (!month) return null
  return `Sources probed ${d.getUTCDate()} ${month}`
}

export function SourcesProbedNote({ iso }: { iso?: string | null }) {
  if (!iso) return null
  const label = sourcesProbedLabel(iso)
  if (!label) return null
  return (
    <span data-testid="sources-probed" className="inline-flex whitespace-nowrap font-mono text-[10px] leading-none text-mp-ink-secondary">{label}</span>
  )
}
