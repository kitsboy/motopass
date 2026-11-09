/**
 * Copy public travel-advice feeds into public/data/advisories.json.
 *
 * United States: https://cadataapi.state.gov/api/TravelAdvisories
 * United Kingdom: https://www.gov.uk/api/content/foreign-travel-advice/{slug}
 * Argentina: https://www.cancilleria.gob.ar/es/servicios/viajar-al-exterior/alertas
 *
 * A feed that does not answer leaves the previous copy in place.
 * This file does not edit research/countries.json.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = resolve(root, 'public/data/advisories.json')
const US_URL = 'https://cadataapi.state.gov/api/TravelAdvisories'
const UK_API = 'https://www.gov.uk/api/content/foreign-travel-advice'
const AR_URL = 'https://www.cancilleria.gob.ar/es/servicios/viajar-al-exterior/alertas'

/** ISO and UK slug for the 21 programs. Spanish names are how Cancillería writes the place. */
export const DESTINATIONS = [
  { iso: 'SV', slug: 'el-salvador', needles: ['El Salvador'] },
  { iso: 'PT', slug: 'portugal', needles: ['Portugal'] },
  { iso: 'IT', slug: 'italy', needles: ['Italia', 'Italy'] },
  { iso: 'UY', slug: 'uruguay', needles: ['Uruguay'] },
  { iso: 'AG', slug: 'antigua-and-barbuda', needles: ['Antigua', 'Barbuda'] },
  { iso: 'KN', slug: 'st-kitts-and-nevis', needles: ['San Cristóbal', 'Saint Kitts', 'St. Kitts', 'St Kitts', 'Nevis'] },
  { iso: 'DM', slug: 'dominica', needles: ['Dominica'] },
  { iso: 'LC', slug: 'st-lucia', needles: ['Santa Lucía', 'Saint Lucia', 'St. Lucia', 'St Lucia'] },
  { iso: 'GD', slug: 'grenada', needles: ['Grenada'] },
  { iso: 'BS', slug: 'bahamas', needles: ['Bahamas'] },
  { iso: 'BB', slug: 'barbados', needles: ['Barbados'] },
  { iso: 'KY', slug: 'cayman-islands', needles: ['Caimán', 'Cayman'] },
  { iso: 'ES', slug: 'spain', needles: ['España', 'Spain'] },
  { iso: 'IE', slug: 'ireland', needles: ['Irlanda', 'Ireland'] },
  { iso: 'AR', slug: 'argentina', needles: [] },
  { iso: 'BR', slug: 'brazil', needles: ['Brasil', 'Brazil'] },
  { iso: 'MT', slug: 'malta', needles: ['Malta'] },
  { iso: 'VU', slug: 'vanuatu', needles: ['Vanuatu'] },
  { iso: 'PA', slug: 'panama', needles: ['Panamá', 'Panama'] },
  { iso: 'MX', slug: 'mexico', needles: ['México', 'Mexico'] },
  { iso: 'ST', slug: 'sao-tome-and-principe', needles: ['Santo Tomé', 'São Tomé', 'Sao Tome'] },
]

export function plain(html, max = 320) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

function escapeReg(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Whole-word match so "argentinos" does not count as the country Argentina. */
export function namesPlace(hay, name) {
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeReg(name)}(?:$|[^\\p{L}\\p{N}])`, 'iu')
  return re.test(hay)
}

export function parseArgentinaAlerts(html) {
  const alerts = []
  const re = /<article\b[^>]*\babout="([^"]+)"[^>]*>[\s\S]*?<h2>\s*<a[^>]*>([^<]+)<\/a>[\s\S]*?property="content:encoded">([\s\S]*?)<\/div>/gi
  let match = re.exec(html)
  while (match) {
    const path = match[1]
    const title = plain(match[2], 180)
    const detail = plain(match[3], 420)
    const hay = `${title} ${detail}`
    const matches = DESTINATIONS.filter(dest => dest.needles.some(needle => namesPlace(hay, needle))).map(dest => dest.iso)
    alerts.push({
      title,
      detail,
      href: path.startsWith('http') ? path : `https://www.cancilleria.gob.ar${path}`,
      matches,
    })
    match = re.exec(html)
  }
  return alerts
}

/**
 * The State Department feed uses its own category codes, not ISO.
 * ES is El Salvador there, and ST is Saint Lucia. Match the title instead.
 */
const US_TITLE_ISO = [
  [/el salvador/i, 'SV'],
  [/portugal/i, 'PT'],
  [/italy/i, 'IT'],
  [/uruguay/i, 'UY'],
  [/antigua/i, 'AG'],
  [/saint kitts|st\.?\s*kitts/i, 'KN'],
  [/dominica(?!n)/i, 'DM'],
  [/saint lucia|st\.?\s*lucia/i, 'LC'],
  [/grenada/i, 'GD'],
  [/bahamas/i, 'BS'],
  [/barbados/i, 'BB'],
  [/cayman/i, 'KY'],
  [/spain/i, 'ES'],
  [/ireland/i, 'IE'],
  [/argentina/i, 'AR'],
  [/brazil/i, 'BR'],
  [/malta/i, 'MT'],
  [/vanuatu/i, 'VU'],
  [/panama/i, 'PA'],
  [/mexico/i, 'MX'],
  [/s[aã]o tom[eé]|sao tome/i, 'ST'],
]

export function matchUsIso(title) {
  const text = String(title || '')
  const found = US_TITLE_ISO.find(([re]) => re.test(text))
  return found ? found[1] : null
}

export function usRecord(row) {
  const title = plain(row.Title || row.title || '', 160)
  const levelMatch = title.match(/Level\s+(\d)/i)
  const label = title.includes(':') ? plain(title.split(':').slice(1).join(':'), 80) : title
  return {
    iso: matchUsIso(title),
    level: levelMatch ? Number(levelMatch[1]) : null,
    label,
    summary: plain(row.Summary || row.summary || '', 280),
    href: String(row.Link || row.link || ''),
    updated: row.Updated || row.Published || null,
  }
}

async function getText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { accept: 'application/json, text/html' } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.text()
}

function readPrevious() {
  try {
    return JSON.parse(readFileSync(outPath, 'utf8'))
  } catch {
    return null
  }
}

export async function buildAdvisoryFile() {
  const previous = readPrevious()
  const byIso = {}
  for (const dest of DESTINATIONS) {
    byIso[dest.iso] = {
      us: previous?.by_iso?.[dest.iso]?.us ?? null,
      uk: previous?.by_iso?.[dest.iso]?.uk ?? null,
      ar: previous?.by_iso?.[dest.iso]?.ar ?? [],
    }
  }

  const file = {
    fetched_at: new Date().toISOString(),
    us: { source: US_URL, audience: 'United States citizens', error: null },
    uk: { source: UK_API, audience: 'British nationals', error: null },
    ar: { source: AR_URL, audience: 'Argentine citizens', error: null },
    by_iso: byIso,
    argentina_alerts: previous?.argentina_alerts ?? [],
  }

  try {
    const rows = JSON.parse(await getText(US_URL))
    if (!Array.isArray(rows) || rows.length < 50) throw new Error('short list')
    const wanted = new Set(DESTINATIONS.map(dest => dest.iso))
    const next = {}
    for (const row of rows) {
      const record = usRecord(row)
      if (!record.iso || !wanted.has(record.iso)) continue
      next[record.iso] = {
        level: record.level,
        label: record.label,
        summary: record.summary,
        href: record.href,
        updated: record.updated,
      }
    }
    for (const dest of DESTINATIONS) file.by_iso[dest.iso].us = next[dest.iso] ?? null
  } catch (error) {
    file.us.error = error instanceof Error ? error.message : String(error)
  }

  const ukErrors = []
  for (const dest of DESTINATIONS) {
    try {
      const page = JSON.parse(await getText(`${UK_API}/${dest.slug}`))
      const details = page.details || {}
      const status = Array.isArray(details.alert_status) ? details.alert_status.map(String) : []
      file.by_iso[dest.iso].uk = {
        alert_status: status,
        change: plain(details.change_description || '', 180),
        updated: page.public_updated_at || null,
        href: `https://www.gov.uk/foreign-travel-advice/${dest.slug}`,
      }
    } catch (error) {
      ukErrors.push(`${dest.iso}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  if (ukErrors.length) file.uk.error = ukErrors.join('; ')

  try {
    const alerts = parseArgentinaAlerts(await getText(AR_URL))
    if (alerts.length === 0) throw new Error('no alert articles')
    file.argentina_alerts = alerts
    for (const dest of DESTINATIONS) file.by_iso[dest.iso].ar = []
    for (const alert of alerts) {
      for (const iso of alert.matches) {
        if (file.by_iso[iso]) file.by_iso[iso].ar.push({ title: alert.title, detail: alert.detail, href: alert.href })
      }
    }
  } catch (error) {
    file.ar.error = error instanceof Error ? error.message : String(error)
  }

  return file
}

async function main() {
  const file = await buildAdvisoryFile()
  const tmp = `${outPath}.tmp`
  writeFileSync(tmp, `${JSON.stringify(file, null, 2)}\n`)
  renameSync(tmp, outPath)
  const usCount = Object.values(file.by_iso).filter(row => row.us?.level).length
  console.log(`advisories.json us=${usCount} uk_error=${file.uk.error ? 'yes' : 'no'} ar=${file.argentina_alerts.length} ar_error=${file.ar.error || 'no'}`)
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isDirect) {
  main().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
