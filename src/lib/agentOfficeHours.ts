/** Mon–Fri 9:00–17:00 local time in IANA timezone */
export function isOfficeHoursOpen(timeZone: string, now = new Date()): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now)

    const weekday = parts.find(p => p.type === 'weekday')?.value ?? ''
    const hour = Number(parts.find(p => p.type === 'hour')?.value ?? 0)
    const minute = Number(parts.find(p => p.type === 'minute')?.value ?? 0)
    const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    if (!day.includes(weekday)) return false
    const mins = hour * 60 + minute
    return mins >= 9 * 60 && mins < 17 * 60
  } catch {
    return false
  }
}

export const KIMI_TIMEZONE = 'Asia/Singapore'

export const AGENT_SLA: Record<string, string> = {
  uy: '24–48h',
  sv: '24–48h',
  ae: '48–72h',
  sg: '24–48h',
  pt: '48–72h',
  ge: '72–96h',
}