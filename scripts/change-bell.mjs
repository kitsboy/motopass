/**
 * Print the change bell. Post it only when MOTOPASS_CHANGE_WEBHOOK_URL is a
 * public https address. This file does not publish to Nostr and does not
 * edit research/countries.json.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function latestIso(values) {
  const stamps = values.filter(Boolean)
  if (!stamps.length) return null
  return stamps.slice().sort().at(-1)
}

export function reportFromPrograms(programs) {
  const countries = programs.map(program => {
    const pages = program.watch?.urls ?? []
    const changedPages = pages.filter(page => page.status === 'changed')
    const changed = program.watch?.changed === true || changedPages.length > 0
    return {
      name: program.name,
      changed,
      lastProbeAt: program.watch?.last_probe_at ?? null,
      changedPages,
    }
  })
  const changed = countries.filter(country => country.changed)
  return {
    changed,
    steady: countries.length - changed.length,
    latestProbe: latestIso(countries.map(country => country.lastProbeAt)),
  }
}

export function payloadFromReport(report) {
  return {
    kind: 'motopass.change-bell',
    probed_at: report.latestProbe,
    steady: report.steady,
    changed: report.changed.map(country => ({
      name: country.name,
      urls: country.changedPages.map(page => page.url),
    })),
  }
}

export function webhookUrlAllowed(raw) {
  if (!raw?.trim()) return false
  let url
  try {
    url = new URL(raw.trim())
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!v4) return true
  const a = Number(v4[1])
  const b = Number(v4[2])
  if (a === 10 || a === 127 || a === 0) return false
  if (a === 169 && b === 254) return false
  if (a === 192 && b === 168) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  return true
}

async function main() {
  const catalog = JSON.parse(readFileSync(resolve(root, 'research/countries.json'), 'utf8'))
  const payload = payloadFromReport(reportFromPrograms(catalog.programs))
  const body = JSON.stringify(payload)
  const target = process.env.MOTOPASS_CHANGE_WEBHOOK_URL
  if (!webhookUrlAllowed(target)) {
    process.stdout.write(`${body}\n`)
    return
  }
  const response = await fetch(target, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
  process.stdout.write(`posted ${response.status} ${target}\n`)
  if (!response.ok) process.exitCode = 1
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isDirect) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : 'change bell failed')
    process.exitCode = 1
  })
}
