import { KIMI_TIMEZONE } from './agentOfficeHours'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatIcsUtc(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

/** Next Mon–Fri 09:00 office-hours block in Kimi's timezone (stub .ics download). */
export function buildKimiOfficeHoursIcs(now = new Date()): string {
  const start = new Date(now)
  while (start.getDay() === 0 || start.getDay() === 6) {
    start.setDate(start.getDate() + 1)
  }

  const end = new Date(start)
  end.setHours(end.getHours() + 8)

  const uid = `kimi-office-hours-${formatIcsUtc(start)}@motopass.giveabit.io`
  const dtstamp = formatIcsUtc(now)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MotoPass//Kimi Office Hours//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${KIMI_TIMEZONE}:${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T090000`,
    `DTEND;TZID=${KIMI_TIMEZONE}:${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T170000`,
    'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    'SUMMARY:Kimi — MotoPass liaison office hours',
    'DESCRIPTION:Mon–Fri 09:00–17:00 local time. Nostr DM stub — live scheduling ships with Nexus gates.',
    'LOCATION:Nostr / MotoPass Agents',
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadKimiOfficeHoursIcs(filename = 'kimi-office-hours.ics'): void {
  const blob = new Blob([buildKimiOfficeHoursIcs()], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}