import type { BtcMapPlace } from './btcmap'
import { programCacheSlug } from './btcmapSlug'

function csvCell(value: string | number | undefined): string {
  if (value == null || value === '') return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Serialize merchant directory rows for CSV download (item 621). */
export function placesToCsv(places: BtcMapPlace[], programName: string): string {
  const header = ['program', 'id', 'name', 'address', 'lat', 'lon', 'verified_at', 'website'].join(',')
  const rows = places.map(p =>
    [
      csvCell(programName),
      csvCell(p.id),
      csvCell(p.name),
      csvCell(p.address),
      csvCell(p.lat),
      csvCell(p.lon),
      csvCell(p.verified_at),
      csvCell(p.website),
    ].join(','),
  )
  return [header, ...rows].join('\n')
}

export function downloadPlacesCsv(places: BtcMapPlace[], programName: string): void {
  const csv = placesToCsv(places, programName)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `btcmap-${programCacheSlug(programName)}-merchants.csv`
  a.click()
  URL.revokeObjectURL(url)
}