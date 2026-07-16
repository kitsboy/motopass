import { describe, it, expect } from 'vitest'
import { buildKimiOfficeHoursIcs } from './kimiOfficeHoursIcs'

describe('kimiOfficeHoursIcs', () => {
  it('builds valid ics calendar stub', () => {
    const ics = buildKimiOfficeHoursIcs(new Date('2026-07-15T12:00:00Z'))
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')
    expect(ics).toContain('TZID=Asia/Singapore')
    expect(ics).toContain('Kimi — MotoPass liaison office hours')
  })
})